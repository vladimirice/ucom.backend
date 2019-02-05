/* eslint-disable max-len */
/* tslint:disable:max-line-length */
const status  = require('statuses');
const _       = require('lodash');
const joi     = require('joi');

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

const usersActivity = require('../../users/user-activity-service');

const organizationsRepositories = require('../repository');
const models = require('../../../models');
const { AppError, BadRequestError, HttpForbiddenError } = require('../../../lib/api/errors');

const db = models.sequelize;

const userInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');
const { CreateOrUpdateOrganizationSchema } =
  require('../validator/organization-create-update-schema');
const authValidator = require('../../auth/validators');


const eosBlockchainUniqId = require('../../eos/eos-blockchain-uniqid');
const usersTeamService = require('../../users/users-team-service');
const entitySourceService = require('../../entities/service').Sources;
const organizationsModelProvider = require('./organizations-model-provider');
const usersActivityRepository = require('../../users/repository').Activity;
const activityGroupDictionary = require('../../activity/activity-group-dictionary');

const apiPostProcessor = require('../../common/service').PostProcessor;

class OrganizationService {
  private currentUser;

  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @return {string}
   */
  static getEntityName() {
    return organizationsModelProvider.getEntityName();
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewOrganizationCreation(req) {
    await OrganizationService.addSignedTransactionsForOrganizationCreation(req);

    const body = await this.processUserRequest(req);
    body.blockchain_id = req.blockchain_id;

    const { newOrganization, newUserActivity, boardInvitationActivity } = await db
      .transaction(async (transaction) => {
        const newModel =
          await organizationsRepositories.Main.createNewOrganization(body, transaction);

        const usersTeam = await usersTeamService.processNewModelWithTeam(
          newModel.id,
          OrganizationService.getEntityName(),
          body,
          this.currentUser.id,
          transaction,
        );

        const usersTeamIds = usersTeamService.getUsersTeamIds(usersTeam);

        // eslint-disable-next-line no-shadow
        const newUserActivity = await usersActivity.processNewOrganization(
          req.signed_transaction,
          this.currentUser.id,
          newModel.id,
          transaction,
        );

        // eslint-disable-next-line no-shadow
        const boardInvitationActivity: any = [];
        for (let i = 0; i < usersTeamIds.length; i += 1) {
          const res = await usersActivity.processUsersBoardInvitation(
            this.currentUser.id,
            usersTeamIds[i],
            newModel.id,
            transaction,
          );

          boardInvitationActivity.push(res);
        }

        const entityName = organizationsModelProvider.getEntityName();
        await entitySourceService.processCreationRequest(
          newModel.id,
          entityName,
          body,
          transaction,
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newUserActivity,
          boardInvitationActivity,
          newOrganization: newModel,
        };
      });

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
  private static async sendOrgCreationActivityToRabbit(newUserActivity) {
    await usersActivity.sendPayloadToRabbit(newUserActivity);
  }

  /**
   *
   * @param {Object[]} boardInvitationActivity
   * @return {Promise<void>}
   * @private
   */
  private static async sendOrgTeamInvitationsToRabbit(boardInvitationActivity) {
    for (let i = 0; i < boardInvitationActivity.length; i += 1) {
      await usersActivity.sendPayloadToRabbit(boardInvitationActivity[i]);
    }
  }

  /**
   *
   * @param {Object} req
   * @returns {Promise<void>}
   */
  async updateOrganization(req) {
    if (_.isEmpty(req.body) && _.isEmpty(req.files)) {
      throw new BadRequestError({
        general: 'Updating by empty body and empty file uploading is not allowed',
      });
    }

    const orgId = req.organization_id;
    const userId = this.currentUser.id;

    await OrganizationService.checkUpdatePermissions(orgId, userId);
    const body = await this.processUserRequest(req);

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

        const deltaData = await usersTeamService.processUsersTeamUpdating(
          orgId,
          organizationsModelProvider.getEntityName(),
          body,
          this.currentUser.id,
          transaction,
        );

        if (updatedCount !== 1) {
          throw new AppError(`No success to update organization with ID ${orgId} and author ID ${userId}`, status('not found'));
        }

        await entitySourceService.processSourcesUpdating(
          orgId,
          organizationsModelProvider.getEntityName(),
          body,
          transaction,
        );

        // eslint-disable-next-line no-shadow
        let boardInvitationActivity = [];
        if (deltaData) {
          boardInvitationActivity = await this.processUsersTeamInvitations(deltaData.added, orgId, transaction);
        }

        return {
          boardInvitationActivity,
          updatedModel: updatedModels[0],
        };
      });

    // Send to rabbit

    await OrganizationService.sendOrgTeamInvitationsToRabbit(boardInvitationActivity);

    // try {
    //   await this._processNotifications(deltaData.added);
    // } catch (err) {
    //   console.warn('Error related to sockets. Not possible to send notifications properly. But rest of the code will be processed.');
    //   console.dir(err);
    // }

    return updatedModel;
  }

  /**
   *
   * @param {Object[]} usersToAddFromRequest
   * @param {number} orgId
   * @param {Object} transaction
   * @return {Promise<Array>}
   * @private
   */
  private async processUsersTeamInvitations(usersToAddFromRequest, orgId, transaction) {
    if (!usersToAddFromRequest || _.isEmpty(usersToAddFromRequest)) {
      return [];
    }

    const usersTeamIds = usersTeamService.getUsersTeamIds(usersToAddFromRequest);
    const boardInvitationActivity: any = [];
    for (let i = 0; i < usersTeamIds.length; i += 1) {
      const res = await usersActivity.processUsersBoardInvitation(
        this.currentUser.id,
        usersTeamIds[i],
        orgId,
        transaction,
      );

      boardInvitationActivity.push(res);
    }

    return boardInvitationActivity;
  }

  /**
   *
   * @param {number} modelId
   * @returns {Promise<Object>}
   */
  async findOneOrgByIdAndProcess(modelId) {
    const where = {
      id: modelId,
    };

    const modelsToInclude = [
      'Users',
      'users_team',
    ];

    const model = await organizationsRepositories.Main.findOneBy(where, modelsToInclude);

    const entitySources = await entitySourceService.findAndGroupAllEntityRelatedSources(
      modelId,
      organizationsModelProvider.getEntityName(),
    );

    const activityData = await usersActivityRepository.findEntityRelatedActivityWithInvolvedUsersData(
      modelId,
      organizationsModelProvider.getEntityName(),
      InteractionTypeDictionary.getFollowId(),
      activityGroupDictionary.getGroupContentInteraction(),
    );

    apiPostProcessor.processOneOrgFully(model, this.currentUser.id, activityData);

    // #refactor. Add to the model inside EntitySourceService
    model.social_networks      = entitySources.social_networks;
    model.community_sources    = entitySources.community_sources;
    model.partnership_sources  = entitySources.partnership_sources;

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
  private static getRequestBodyWithFilenames(req) {
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
      } else {
        body.avatar_filename = file.filename;
        body.avatar_filename_from_file = true;
      }
    });

    if (body.avatar_filename_from_file !== true) {
      delete body.avatar_filename;
    }

    return body;
  }

  private static addSourceAvatarFilenameToBody(file, body) {
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

  private static parseSourceFiles(files) {
    files.forEach((file) => {
      if (file.fieldname !== 'avatar_filename') {
        const sourceKey = file.filename.substr(0, file.filename.indexOf('-'));
        const sourcePosition = +file.filename.substring(
          OrganizationService.getPosition(file.filename, '-', 1) + 1,
          OrganizationService.getPosition(file.filename, '-', 2),
        );

        file.modelSourceKey = sourceKey;
        file.modelSourcePosition = sourcePosition;
      }
    });
  }

  private static getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
  }

  /**
   *
   * @param {Object} req
   * @return {Object}
   * @private
   */
  private async  processUserRequest(req) {
    const body = OrganizationService.getRequestBodyWithFilenames(req);

    const simpleTextFields = organizationsRepositories.Main.getModelSimpleTextFields();
    userInputSanitizer.sanitizeRequestBody(body, simpleTextFields);

    const { error, value } = joi.validate(body, CreateOrUpdateOrganizationSchema, {
      allowUnknown: true,
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(
        authValidator.formatErrorMessages(error.details),
      );
    }

    OrganizationService.makeEmptyStringUniqueFieldsNull(value);

    await OrganizationService.checkUniqueFields(value, req.organization_id);

    value.user_id = this.currentUser.id;

    return value;
  }

  /**
   *
   * @param   {Object} values
   * @param   {number|null} organizationId
   * @return  {Promise<void>}
   * @private
   */
  private static async checkUniqueFields(values, organizationId = null) {
    const uniqueFields = organizationsRepositories.Main.getOrganizationModel().getUniqueFields();

    const toFind = {};

    uniqueFields.forEach((field) => {
      if (values[field]) {
        toFind[field] = values[field];
      }
    });

    const existed = await organizationsRepositories.Main.findWithUniqueFields(toFind);

    const errors: any = [];
    for (let i = 0; i < existed.length; i += 1) {
      const current = existed[i];

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
  private static makeEmptyStringUniqueFieldsNull(body) {
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
  private static async checkUpdatePermissions(orgId, userId) {
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
  private static async addSignedTransactionsForOrganizationCreation(req) {
    const currentUser = req.container.get('current-user').user;

    req.blockchain_id = eosBlockchainUniqId.getUniqIdWithoutId('org');
    req.signed_transaction = await usersActivity.createAndSignOrganizationCreationTransaction(currentUser, req.blockchain_id);
  }
}

export = OrganizationService;
