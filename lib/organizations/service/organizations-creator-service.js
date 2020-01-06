"use strict";
const errors_1 = require("../../api/errors");
const organizations_dictionary_1 = require("../dictionary/organizations-dictionary");
const OrgsCurrentParamsRepository = require("../repository/organizations-current-params-repository");
const OrganizationsModelProvider = require("./organizations-model-provider");
const EntitySourceService = require("../../entities/service/entity-sources-service");
const OrganizationsInputProcessor = require("../validator/organizations-input-processor");
const EntityImageInputService = require("../../entity-images/service/entity-image-input-service");
const OrganizationsRepository = require("../repository/organizations-repository");
const UsersTeamService = require("../../users/users-team-service");
const UserActivityService = require("../../users/user-activity-service");
const OrganizationsUpdatingService = require("./organizations-updating-service");
const EosInputProcessor = require("../../eos/input-processor/content/eos-input-processor");
const EosApi = require("../../eos/eosApi");
const knex = require("../../../config/knex");
const models = require('../../../models');
const db = models.sequelize;
class OrganizationsCreatorService {
    static async updateOrganizationSetMultiSignature(organization, user, body) {
        if (organization.user_id !== user.id) {
            throw new errors_1.BadRequestError('Only community author is able to change community type to the multi-signature');
        }
        if (organization.organization_type_id !== organizations_dictionary_1.ORGANIZATION_TYPE_ID__CONTENT) {
            throw new errors_1.BadRequestError(`Only community with type: ${organizations_dictionary_1.ORGANIZATION_TYPE_ID__CONTENT} might be migrated`);
        }
        const { account_name: accountName } = body;
        if (!accountName) {
            throw new errors_1.BadRequestError('Please provide an existing multi-signature account_name');
        }
        // #task - check a multi-signature status of the account
        const doesExist = await EosApi.doesAccountExist(accountName);
        if (!doesExist) {
            throw new errors_1.BadRequestError(`account with the name: ${accountName} does not exist`);
        }
        await knex(OrganizationsModelProvider.getTableName())
            .where({ id: organization.id })
            .update({
            nickname: accountName,
            organization_type_id: organizations_dictionary_1.ORGANIZATION_TYPE_ID__MULTI_SIGNATURE,
        });
    }
    static async processNewOrganizationCreation(req, currentUser, isMultiSignature) {
        OrganizationsInputProcessor.process(req.body);
        EntityImageInputService.processEntityImageOrMakeItEmpty(req.body);
        const signedTransaction = await EosInputProcessor.processWithIsMultiSignatureForCreation(req.body, 'nickname', isMultiSignature);
        const body = await OrganizationsInputProcessor.processCreation(req, currentUser);
        const { newOrganization, newUserActivity, boardInvitationActivity } = await db
            .transaction(async (transaction) => {
            const newModel = await OrganizationsRepository.createNewOrganization(body, isMultiSignature, transaction);
            const usersTeam = await UsersTeamService.processNewModelWithTeam(newModel.id, OrganizationsModelProvider.getEntityName(), body, currentUser.id, transaction);
            const usersTeamIds = UsersTeamService.getUsersTeamIds(usersTeam);
            // eslint-disable-next-line no-shadow
            const newUserActivity = await UserActivityService.processNewOrganization(signedTransaction, currentUser.id, newModel.id, transaction);
            // eslint-disable-next-line no-shadow
            const boardInvitationActivity = [];
            for (const element of usersTeamIds) {
                const res = await UserActivityService.processUsersBoardInvitation(currentUser.id, element, newModel.id, transaction);
                boardInvitationActivity.push(res);
            }
            const entityName = OrganizationsModelProvider.getEntityName();
            await EntitySourceService.processCreationRequest(newModel.id, entityName, body, transaction);
            // noinspection JSUnusedGlobalSymbols
            return {
                newUserActivity,
                boardInvitationActivity,
                newOrganization: newModel,
            };
        });
        // #task - create new entity via knex only and provide related transaction
        await Promise.all([
            OrgsCurrentParamsRepository.insertRowForNewEntity(newOrganization.id),
            UserActivityService.sendPayloadToRabbitEosV2WithSuppressEmpty(newUserActivity),
            OrganizationsUpdatingService.sendOrgTeamInvitationsToRabbit(boardInvitationActivity),
        ]);
        return newOrganization;
    }
}
module.exports = OrganizationsCreatorService;
