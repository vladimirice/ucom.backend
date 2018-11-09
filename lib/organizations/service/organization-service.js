const status  = require('statuses');
const _       = require('lodash');
const Joi     = require('joi');

const UsersActivity = require('../../users/user-activity-service');

const OrganizationsRepositories = require('../repository');
const models = require('../../../models');
const {AppError, BadRequestError, HttpForbiddenError} = require('../../../lib/api/errors');

const db = models.sequelize;

const UserInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');
const {CreateOrUpdateOrganizationSchema} = require('../validator/organization-create-update-schema');
const AuthValidator = require('../../auth/validators');

const EosBlockchainUniqId = require('../../eos/eos-blockchain-uniqid');
const UsersTeamService = require('../../users/users-team-service');
const EntitySourceService = require('../../entities/service').Sources;
const OrganizationsModelProvider = require('./organizations-model-provider');
const OrgPostProcessor = require('./organization-post-processor');
const UsersActivityRepository = require('../../users/repository').Activity;
const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');
const { InteractionTypeDictionary } = require('uos-app-transaction');

const ApiPostProcessor = require('../../common/service').PostProcessor;

const QueryFilterService = require('../../api/filters/query-filter-service');

const SocketIoServer = require('../../../lib/websockets/socket-io-server');

const EntityNotificationRepository  = require('../../entities/repository').Notifications;

class OrganizationService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @return {string}
   */
  static getEntityName() {
    return OrganizationsModelProvider.getEntityName();
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewOrganizationCreation(req) {
    await OrganizationService._addSignedTransactionsForOrganizationCreation(req);

    let body = await this._processUserRequest(req);
    body.blockchain_id = req.blockchain_id;

    const { newOrganization, newUserActivity, boardInvitationActivity } = await db
      .transaction(async transaction => {
        const newModel = await OrganizationsRepositories.Main.createNewOrganization(body, transaction);

        const usersTeam = await UsersTeamService.processNewModelWithTeam(
          newModel.id,
          OrganizationService.getEntityName(),
          body,
          this.currentUser.id,
          transaction
        );

        const usersTeamIds = UsersTeamService.getUsersTeamIds(usersTeam);

        const newUserActivity = await UsersActivity.processNewOrganization(
          req.signed_transaction,
          this.currentUser.id,
          newModel.id,
          transaction
        );

        let boardInvitationActivity = [];
        for (let i = 0; i < usersTeamIds.length; i++) {
          const res = await UsersActivity.processUsersBoardInvitation(
            this.currentUser.id,
            usersTeamIds[i],
            newModel.id,
            transaction
          );

          boardInvitationActivity.push(res);
        }

        const entityName = OrganizationsModelProvider.getEntityName();
        await EntitySourceService.processCreationRequest(newModel.id, entityName, body, transaction);

        // noinspection JSUnusedGlobalSymbols
        return {
          newOrganization: newModel,
          newUserActivity,
          boardInvitationActivity
        };
    });

    await this._sendOrgCreationActivityToRabbit(newUserActivity);
    await this._sendOrgTeamInvitationsToRabbit(boardInvitationActivity);

    return newOrganization;
  }

  /**
   *
   * @param {Object} newUserActivity
   * @return {Promise<void>}
   * @private
   */
  async _sendOrgCreationActivityToRabbit(newUserActivity) {
    await UsersActivity.sendPayloadToRabbit(newUserActivity)
  }

  /**
   *
   * @param {Object[]} boardInvitationActivity
   * @return {Promise<void>}
   * @private
   */
  async _sendOrgTeamInvitationsToRabbit(boardInvitationActivity) {
    for (let i = 0; i < boardInvitationActivity.length; i++) {
      await UsersActivity.sendPayloadToRabbit(boardInvitationActivity[i]);
    }
  }

  /**
   * @deprecated
   * @param {Object} usersTeam
   * @return {Promise<void>}
   * @private
   */
  async _processNotifications(usersTeam) {
    if (usersTeam && !_.isEmpty(usersTeam)) {

      for (let i = 0; i < usersTeam.length; i++) {

        const current = usersTeam[i];
        const userId = current.id || current.user_id;

        await this._sendNewUnreadMessageEventToSocket(+userId);
      }
    }
  }

  /**
   *
   * @param {number} userId
   * @private
   */
  async _sendNewUnreadMessageEventToSocket(userId) {
    const unread_messages_count = await EntityNotificationRepository.countUnreadMessages(userId);

    // TODO - use event emitters or rabbitMQ. Do this after updating
    SocketIoServer.emitToUser(userId, 'notification', {
      unread_messages_count,
    });
  }

  /**
   *
   * @param {Object} req
   * @returns {Promise<void>}
   */
  async updateOrganization(req) {
    if (_.isEmpty(req.body) && _.isEmpty(req.files)) {
      throw new BadRequestError({
        'general': 'Updating by empty body and empty file uploading is not allowed'
      });
    }

    const org_id = req.organization_id;
    const user_id = this.currentUser.id;

    await this._checkUpdatePermissions(org_id, user_id);
    const body = await this._processUserRequest(req);

    const { updatedModel, boardInvitationActivity } = await db
      .transaction(async transaction => {
        const [updatedCount, updatedModels] = await OrganizationsRepositories.Main.getOrganizationModel().update(body, {
          where: {
            id: org_id,
            user_id
          },
          returning: true,
          raw: true,
          transaction
        });

        const deltaData = await UsersTeamService.processUsersTeamUpdating(
          org_id,
          OrganizationsModelProvider.getEntityName(),
          body,
          this.currentUser.id,
          transaction
        );

        if (updatedCount !== 1) {
          throw new AppError(`No success to update organization with ID ${org_id} and author ID ${user_id}`, status('not found'));
        }

        await EntitySourceService.processSourcesUpdating(
          org_id,
          OrganizationsModelProvider.getEntityName(),
          body,
          transaction
        );

        let boardInvitationActivity = [];
        if (deltaData) {
          boardInvitationActivity = await this._processUsersTeamInvitations(deltaData.added, org_id, transaction);
        }

        return {
          updatedModel: updatedModels[0],
          boardInvitationActivity
        };
    });

    // Send to rabbit

    await this._sendOrgTeamInvitationsToRabbit(boardInvitationActivity);

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
   * @param {number} org_id
   * @param {Object} transaction
   * @return {Promise<Array>}
   * @private
   */
  async _processUsersTeamInvitations(usersToAddFromRequest, org_id, transaction) {
    if (!usersToAddFromRequest || _.isEmpty(usersToAddFromRequest)) {
      return [];
    }

    const usersTeamIds = UsersTeamService.getUsersTeamIds(usersToAddFromRequest);
    let boardInvitationActivity = [];
    for (let i = 0; i < usersTeamIds.length; i++) {
      const res = await UsersActivity.processUsersBoardInvitation(
        this.currentUser.id,
        usersTeamIds[i],
        org_id,
        transaction
      );

      boardInvitationActivity.push(res);
    }

    return boardInvitationActivity;
  }

  /**
   * @param {Object} query
   * @return {Promise<Object>}
   */
  async getAllForPreview(query) {
    let params = QueryFilterService.getQueryParameters(query);

    const models = await OrganizationsRepositories.Main.findAllOrgForList(params);
    OrgPostProcessor.processManyOrganizations(models);

    const totalAmount = await OrganizationsRepositories.Main.countAllOrganizations();
    const metadata    =  QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data :    models,
      metadata: metadata,
    };
  }

  /**
   *
   * @param {number} modelId
   * @returns {Promise<Object>}
   */
  async findOneOrgByIdAndProcess(modelId) {
    const where = {
      'id': modelId,
    };

    const modelsToInclude = [
      'Users',
      'users_team'
    ];

    const model = await OrganizationsRepositories.Main.findOneBy(where, modelsToInclude);

    const entitySources = await EntitySourceService.findAndGroupAllEntityRelatedSources(
      modelId,
      OrganizationsModelProvider.getEntityName()
    );

    const activityData = await UsersActivityRepository.findEntityRelatedActivityWithInvolvedUsersData(
          modelId,
          OrganizationsModelProvider.getEntityName(),
          InteractionTypeDictionary.getFollowId(),
          ActivityGroupDictionary.getGroupContentInteraction()
        );

    ApiPostProcessor.processOneOrgFully(model, this.currentUser.id, activityData);

    // TODO - refactor. Add to the model inside EntitySourceService
    model['social_networks']      = entitySources['social_networks'];
    model['community_sources']    = entitySources['community_sources'];
    model['partnership_sources']  = entitySources['partnership_sources'];

    return {
      data: model,
      metadata: []
    };
  }

  /**
   *
   * @param {Object} req
   * @private
   * @return {Object}
   */
  _getRequestBodyWithFilenames(req) {
    let body = req.body;
    // Lets change file
    const files = req.files;

    this._parseSourceFiles(files);

    // // noinspection OverlyComplexBooleanExpressionJS
    // if (files && files.avatar_filename && files.avatar_filename[0] && files.avatar_filename[0].filename) {
    //   body.avatar_filename = files.avatar_filename[0].filename;
    // } else if (body.avatar_filename) {
    //   delete body.avatar_filename;
    // }

    files.forEach(file => {
      if (file.fieldname !== 'avatar_filename') {
        this._addSourceAvatarFilenameToBody(file, body);
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

  _addSourceAvatarFilenameToBody(file, body) {
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

  _parseSourceFiles(files) {
    files.forEach(file => {
      if (file.fieldname !== 'avatar_filename') {
        const sourceKey = file.filename.substr(0, file.filename.indexOf('-'));
        const sourcePosition = +file.filename.substring(this._getPosition(file.filename, '-', 1) + 1, this._getPosition(file.filename, '-', 2));

        file.modelSourceKey = sourceKey;
        file.modelSourcePosition = sourcePosition;
      }
    });
  }

  _getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
  }

  /**
   *
   * @param {Object} req
   * @return {Object}
   * @private
   */
 async  _processUserRequest(req) {
    const body = this._getRequestBodyWithFilenames(req);

    const simpleTextFields = OrganizationsRepositories.Main.getModelSimpleTextFields();
    UserInputSanitizer.sanitizeRequestBody(body, simpleTextFields);

    let {error, value} = Joi.validate(body, CreateOrUpdateOrganizationSchema, {
      allowUnknown: true,
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(
        AuthValidator.formatErrorMessages(error.details)
      );
    }

    this._makeEmptyStringUniqueFieldsNull(value);

    await this._checkUniqueFields(value, req.organization_id);

    value.user_id = this.currentUser.id;

    return value;
  }


  /**
   *
   * @param   {Object} values
   * @param   {number} organization_id
   * @return  {Promise<void>}
   * @private
   */
  async _checkUniqueFields(values, organization_id = null) {
    const uniqueFields = OrganizationsRepositories.Main.getOrganizationModel().getUniqueFields();

    let toFind = {};

    uniqueFields.forEach(field => {
      if (values[field]) {
        toFind[field] = values[field];
      }
    });

    const existed = await OrganizationsRepositories.Main.findWithUniqueFields(toFind);


    let errors = [];
    for (let i = 0; i < existed.length; i++) {
      const current = existed[i];

      if (organization_id && current.id === organization_id) {
        // this is model itself
        continue;
      }

      uniqueFields.forEach(field => {
        if (current[field] === toFind[field]) {
          errors.push({
            field,
            message: `This value is already occupied. You should try another one.`
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
  _makeEmptyStringUniqueFieldsNull(body) {
    const uniqueFields = OrganizationsRepositories.Main.getOrganizationModel().getUniqueFields();

    uniqueFields.forEach(field => {
      if (body[field] === '') {
        body[field] = null;
      }
    });
  }

  /**
   *
   * @param {number} org_id
   * @param {number} user_id
   */
  async _checkUpdatePermissions(org_id, user_id) {
    const doesExist = await OrganizationsRepositories.Main.doesExistWithUserId(org_id, user_id);

    if (!doesExist) {
      throw new HttpForbiddenError(`It is not allowed for user with ID ${user_id} to update organization with ID: ${org_id}`);
    }
  }

  /**
   * Remove this after signing transactions on frontend
   * @param {Object} req
   * @return {Promise<void>}
   * @private
   */
  static async _addSignedTransactionsForOrganizationCreation(req) {
    const currentUser = req.container.get('current-user').user;

    req.blockchain_id = EosBlockchainUniqId.getUniqIdWithoutId('org');
    req.signed_transaction = await UsersActivity.createAndSignOrganizationCreationTransaction(currentUser, req.blockchain_id);
  }
}

module.exports = OrganizationService;