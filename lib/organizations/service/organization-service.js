"use strict";
/* eslint-disable max-len */
/* tslint:disable:max-line-length */
const OrgsCurrentParamsRepository = require("../repository/organizations-current-params-repository");
const OrganizationsFetchDiscussions = require("../discussions/service/organizations-fetch-discussions");
const OrganizationsInputProcessor = require("../validator/organizations-input-processor");
const OrganizationsRepository = require("../repository/organizations-repository");
const UsersTeamService = require("../../users/users-team-service");
const UserActivityService = require("../../users/user-activity-service");
const EntitySourceService = require("../../entities/service/entity-sources-service");
const DiServiceLocator = require("../../api/services/di-service-locator");
const status = require('statuses');
const _ = require('lodash');
const joi = require('joi');
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const usersActivity = require('../../users/user-activity-service');
const organizationsRepositories = require('../repository');
const models = require('../../../models');
const { AppError, BadRequestError, HttpForbiddenError } = require('../../../lib/api/errors');
const db = models.sequelize;
const { CreateOrUpdateOrganizationSchema } = require('../validator/organization-create-update-schema');
const authValidator = require('../../auth/validators');
const eosBlockchainUniqId = require('../../eos/eos-blockchain-uniqid');
const usersTeamService = require('../../users/users-team-service');
const entitySourceService = require('../../entities/service').Sources;
const organizationsModelProvider = require('./organizations-model-provider');
const usersActivityRepository = require('../../users/repository').Activity;
const activityGroupDictionary = require('../../activity/activity-group-dictionary');
const apiPostProcessor = require('../../common/service').PostProcessor;
class OrganizationService {
    /**
     *
     * @return {string}
     */
    static getEntityName() {
        return organizationsModelProvider.getEntityName();
    }
    static async processNewOrganizationCreation(req, currentUser) {
        OrganizationsInputProcessor.process(req.body);
        await OrganizationService.addSignedTransactionsForOrganizationCreation(req);
        const body = await this.processUserRequest(req, currentUser);
        body.blockchain_id = req.blockchain_id;
        const { newOrganization, newUserActivity, boardInvitationActivity } = await db
            .transaction(async (transaction) => {
            const newModel = await OrganizationsRepository.createNewOrganization(body, transaction);
            const usersTeam = await UsersTeamService.processNewModelWithTeam(newModel.id, OrganizationService.getEntityName(), body, currentUser.id, transaction);
            const usersTeamIds = UsersTeamService.getUsersTeamIds(usersTeam);
            // eslint-disable-next-line no-shadow
            const newUserActivity = await UserActivityService.processNewOrganization(req.signed_transaction, currentUser.id, newModel.id, transaction);
            // eslint-disable-next-line no-shadow
            const boardInvitationActivity = [];
            for (let i = 0; i < usersTeamIds.length; i += 1) {
                const res = await usersActivity.processUsersBoardInvitation(currentUser.id, usersTeamIds[i], newModel.id, transaction);
                boardInvitationActivity.push(res);
            }
            const entityName = organizationsModelProvider.getEntityName();
            await EntitySourceService.processCreationRequest(newModel.id, entityName, body, transaction);
            // noinspection JSUnusedGlobalSymbols
            return {
                newUserActivity,
                boardInvitationActivity,
                newOrganization: newModel,
            };
        });
        // #task - create new entity via knex only and provide related transaction
        // #task use Promise.all when possible
        await OrgsCurrentParamsRepository.insertRowForNewEntity(newOrganization.id);
        await OrganizationService.sendOrgCreationActivityToRabbit(newUserActivity);
        await OrganizationService.sendOrgTeamInvitationsToRabbit(boardInvitationActivity);
        return newOrganization;
    }
    /**
     *
     * @param {Object} newUserActivity
     * @return {Promise<void>}
     * @private
     */
    static async sendOrgCreationActivityToRabbit(newUserActivity) {
        await usersActivity.sendPayloadToRabbit(newUserActivity);
    }
    /**
     *
     * @param {Object[]} boardInvitationActivity
     * @return {Promise<void>}
     * @private
     */
    static async sendOrgTeamInvitationsToRabbit(boardInvitationActivity) {
        for (let i = 0; i < boardInvitationActivity.length; i += 1) {
            await usersActivity.sendPayloadToRabbit(boardInvitationActivity[i]);
        }
    }
    static async updateOrganization(req, currentUser) {
        OrganizationsInputProcessor.process(req.body);
        if (_.isEmpty(req.body) && _.isEmpty(req.files)) {
            throw new BadRequestError({
                general: 'Updating by empty body and empty file uploading is not allowed',
            });
        }
        const orgId = req.organization_id;
        const userId = currentUser.id;
        await OrganizationService.checkUpdatePermissions(orgId, userId);
        const body = await this.processUserRequest(req, currentUser);
        const { updatedModel, boardInvitationActivity } = await db
            .transaction(async (transaction) => {
            const [updatedCount, updatedModels] = await organizationsRepositories.Main.getOrganizationModel().update(body, {
                transaction,
                where: {
                    id: orgId,
                    user_id: userId,
                },
                returning: true,
                raw: true,
            });
            const deltaData = await usersTeamService.processUsersTeamUpdating(orgId, organizationsModelProvider.getEntityName(), body, currentUser.id, transaction);
            if (updatedCount !== 1) {
                throw new AppError(`No success to update organization with ID ${orgId} and author ID ${userId}`, status('not found'));
            }
            await entitySourceService.processSourcesUpdating(orgId, organizationsModelProvider.getEntityName(), body, transaction);
            // eslint-disable-next-line no-shadow
            let boardInvitationActivity = [];
            if (deltaData) {
                boardInvitationActivity = await this.processUsersTeamInvitations(deltaData.added, orgId, transaction, currentUser);
            }
            return {
                boardInvitationActivity,
                updatedModel: updatedModels[0],
            };
        });
        await OrganizationService.sendOrgTeamInvitationsToRabbit(boardInvitationActivity);
        return updatedModel;
    }
    static async processUsersTeamInvitations(usersToAddFromRequest, orgId, transaction, currentUser) {
        if (!usersToAddFromRequest || _.isEmpty(usersToAddFromRequest)) {
            return [];
        }
        const usersTeamIds = usersTeamService.getUsersTeamIds(usersToAddFromRequest);
        const boardInvitationActivity = [];
        for (let i = 0; i < usersTeamIds.length; i += 1) {
            const res = await usersActivity.processUsersBoardInvitation(currentUser.id, usersTeamIds[i], orgId, transaction);
            boardInvitationActivity.push(res);
        }
        return boardInvitationActivity;
    }
    static async findOneOrgByIdAndProcess(modelId, currentUser) {
        const where = {
            id: modelId,
        };
        const modelsToInclude = [
            'Users',
            'users_team',
        ];
        const model = await organizationsRepositories.Main.findOneBy(where, modelsToInclude);
        const entitySources = await entitySourceService.findAndGroupAllEntityRelatedSources(modelId, organizationsModelProvider.getEntityName());
        const activityData = await usersActivityRepository.findEntityRelatedActivityWithInvolvedUsersData(modelId, organizationsModelProvider.getEntityName(), InteractionTypeDictionary.getFollowId(), activityGroupDictionary.getGroupContentInteraction());
        const currentUserId = currentUser ? currentUser.id : null;
        apiPostProcessor.processOneOrgFully(model, currentUserId, activityData);
        // #refactor. Add to the model inside EntitySourceService
        model.social_networks = entitySources.social_networks;
        model.community_sources = entitySources.community_sources;
        model.partnership_sources = entitySources.partnership_sources;
        model.discussions =
            await OrganizationsFetchDiscussions.getManyDiscussions(model.id);
        return {
            data: model,
            metadata: [],
        };
    }
    /**
     *
     * @param {Object} req
     * @private
     * @return {Object}
     */
    static getRequestBodyWithFilenames(req) {
        const { body } = req;
        // Lets change file
        const { files } = req;
        OrganizationService.parseSourceFiles(files);
        // // noinspection OverlyComplexBooleanExpressionJS
        // if (files && files.avatar_filename && files.avatar_filename[0] && files.avatar_filename[0].filename) {
        //   body.avatar_filename = files.avatar_filename[0].filename;
        // } else if (body.avatar_filename) {
        //   delete body.avatar_filename;
        // }
        files.forEach((file) => {
            if (file.fieldname !== 'avatar_filename') {
                OrganizationService.addSourceAvatarFilenameToBody(file, body);
            }
            else {
                body.avatar_filename = file.filename;
                body.avatar_filename_from_file = true;
            }
        });
        if (body.avatar_filename_from_file !== true) {
            delete body.avatar_filename;
        }
        return body;
    }
    static addSourceAvatarFilenameToBody(file, body) {
        const bodySources = body[file.modelSourceKey];
        if (!bodySources) {
            return;
        }
        const bodySource = bodySources[file.modelSourcePosition];
        if (!bodySource) {
            return;
        }
        bodySource.avatar_filename = file.filename;
        bodySource.avatar_filename_from_file = true; // in order to avoid avatar filename changing by only name - without file
    }
    static parseSourceFiles(files) {
        files.forEach((file) => {
            if (file.fieldname !== 'avatar_filename') {
                const sourceKey = file.filename.substr(0, file.filename.indexOf('-'));
                const sourcePosition = +file.filename.substring(OrganizationService.getPosition(file.filename, '-', 1) + 1, OrganizationService.getPosition(file.filename, '-', 2));
                file.modelSourceKey = sourceKey;
                file.modelSourcePosition = sourcePosition;
            }
        });
    }
    static getPosition(string, subString, index) {
        return string.split(subString, index).join(subString).length;
    }
    static async processUserRequest(req, currentUser) {
        const body = OrganizationService.getRequestBodyWithFilenames(req);
        const { error, value } = joi.validate(body, CreateOrUpdateOrganizationSchema, {
            allowUnknown: true,
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            throw new BadRequestError(authValidator.formatErrorMessages(error.details));
        }
        OrganizationService.makeEmptyStringUniqueFieldsNull(value);
        await OrganizationService.checkUniqueFields(value, req.organization_id);
        value.user_id = currentUser.id;
        return value;
    }
    /**
     *
     * @param   {Object} values
     * @param   {number|null} organizationId
     * @return  {Promise<void>}
     * @private
     */
    static async checkUniqueFields(values, organizationId = null) {
        const uniqueFields = organizationsRepositories.Main.getOrganizationModel().getUniqueFields();
        const toFind = {};
        uniqueFields.forEach((field) => {
            if (values[field]) {
                toFind[field] = values[field];
            }
        });
        const existed = await organizationsRepositories.Main.findWithUniqueFields(toFind);
        const errors = [];
        for (const current of existed) {
            if (organizationId && current.id === organizationId) {
                // this is model itself
                continue;
            }
            uniqueFields.forEach((field) => {
                if (current[field] === toFind[field]) {
                    errors.push({
                        field,
                        message: 'This value is already occupied. You should try another one.',
                    });
                }
            });
        }
        if (errors.length > 0) {
            throw new BadRequestError(errors);
        }
    }
    /**
     *
     * @param {Object} body
     * @private
     */
    static makeEmptyStringUniqueFieldsNull(body) {
        const uniqueFields = organizationsRepositories.Main.getOrganizationModel().getUniqueFields();
        uniqueFields.forEach((field) => {
            if (body[field] === '') {
                body[field] = null;
            }
        });
    }
    /**
     *
     * @param {number} orgId
     * @param {number} userId
     */
    static async checkUpdatePermissions(orgId, userId) {
        const doesExist = await organizationsRepositories.Main.doesExistWithUserId(orgId, userId);
        if (!doesExist) {
            throw new HttpForbiddenError(`It is not allowed for user with ID ${userId} to update organization with ID: ${orgId}`);
        }
    }
    /**
     * Remove this after signing transactions on frontend
     * @param {Object} req
     * @return {Promise<void>}
     * @private
     */
    static async addSignedTransactionsForOrganizationCreation(req) {
        const currentUser = DiServiceLocator.getCurrentUserOrException(req);
        req.blockchain_id = eosBlockchainUniqId.getUniqIdWithoutId('org');
        req.signed_transaction = await usersActivity.createAndSignOrganizationCreationTransaction(currentUser, req.blockchain_id);
    }
}
module.exports = OrganizationService;
