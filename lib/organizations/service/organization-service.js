const status = require('statuses');
const _ = require('lodash');
const Joi = require('joi');

const UsersActivity = require('../../users/user-activity-service');

const OrganizationsRepositories = require('../repository');
const models = require('../../../models');
const {AppError, BadRequestError} = require('../../../lib/api/errors');

const db = models.sequelize;

const UserInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');
const {CreateOrUpdateOrganizationSchema} = require('../validator/organization-create-update-schema');
const AuthValidator = require('../../auth/validators');

const UserPostProcessor = require('../../users/user-post-processor');
const EosBlockchainUniqId = require('../../eos/eos-blockchain-uniqid');
const UsersTeamService = require('../../users/users-team-service');


class OrganizationService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @return {string}
   */
  static getEntityName() {
    return 'org';
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
    const signedTransaction = await UsersActivity.createAndSignOrganizationCreationTransaction(currentUser, req.blockchain_id);

    req.signed_transaction = JSON.stringify(signedTransaction);
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewOrganizationCreation(req) {
    await OrganizationService._addSignedTransactionsForOrganizationCreation(req);

    let body = await this._processUserRequest(req);

    // TODO - provide blockchain ID validation
    body.blockchain_id = req.blockchain_id;

    const {newOrganization, newUserActivity} = await db
      .transaction(async transaction => {
        const newModel = await OrganizationsRepositories.Main.createNewOrganization(body, transaction);

        await UsersTeamService.processNewModelWithTeam(
          newModel.id,
          OrganizationService.getEntityName(),
          body,
          this.currentUser.id,
          transaction
        );

        const newUserActivity = await UsersActivity.processNewOrganization(
          req.signed_transaction,
          this.currentUser.id,
          newModel.id,
          transaction
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newOrganization: newModel,
          newUserActivity
        };
    });

    // noinspection JSUnresolvedFunction
    await UsersActivity._sendPayloadToRabbit(newUserActivity, 'users_activity');

    return newOrganization;
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
    const body = await this._processUserRequest(req);

    return await db
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

        await UsersTeamService.processUsersTeamUpdating(org_id, 'org', body, this.currentUser.id, transaction);

        if (updatedCount !== 1) {
          throw new AppError(`No success to update organization with ID ${org_id} and author ID ${user_id}`, status('not found'));
        }

        return updatedModels[0];
      });

    // const jobPayload = PostJobSerializer.getPostDataToCreateJob(updatedModel);

    // try {
    //   await ActivityProducer.publishWithContentUpdating(jobPayload);
    // } catch(err) {
    //   winston.error(err);
    //   winston.error('Not possible to push to the queue. Caught, logged, and proceeded.');
    // }
  }


  /**
   *
   * @return {Promise<Object>}
   */
  async getAllForPreview() {
    const models = await OrganizationsRepositories.Main.findAllForPreview();

    return {
      'data' : models,
      'metadata': [],
    };
  }



  /**
   *
   * @param {number} postId
   * @returns {Promise<Object>}
   */
  async findOneByIdAndProcess(postId) {
    const where = {
      'id': postId
    };
    const modelsToInclude = [
      'Users',
      'users_team'
    ];

    const model = await OrganizationsRepositories.Main.findOneBy(where, modelsToInclude);
    this._processOneAfterQuery(model, this.currentUser.id);

    // Process like a post

    // let activityData = null;
    // if (this.currentUser.isCurrentUser()) {
    //   activityData =
    //     await UserActivityRepository.findUserActivityWithInvolvedUsersData(post.user_id);
    // }
    //
    // return PostService.processOneAfterQuery(post, this.currentUser.id, activityData);

    return {
      data: model,
      metadata: []
    };
  }

  /**
   *
   * @param {Object} model
   * @param {number} currentUserId
   * @return {*}
   * @private
   */
  _processOneAfterQuery (model, currentUserId) {
    if (!model) {
      return null;
    }

    // TODO get current rate from blockchain
    model.current_rate = 0;

    // let userFields = {};
    // for (const field in model) {
    //   if (field.indexOf('User.') === 0) {
    //     userFields[field.replace('User.', '')] = model[field];
    //     delete model[field];
    //   }
    // }
    //
    // model.User = userFields;

    if (currentUserId) {
      let myselfData  = {
        follow: false, // TODO
        editable: false,
        member: false
      };

      if (model.User.id === currentUserId) {
        myselfData.editable = true;
        myselfData.member = true;
      }

      model.myselfData = myselfData;
    }

    UserPostProcessor.processModelAuthor(model);
    UserPostProcessor.processUsersTeamArray(model);

    // TODO part about myself org activity
    // this.addMyselfData(model, currentUserId, userActivityData);
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
    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files.avatar_filename && files.avatar_filename[0] && files.avatar_filename[0].filename) {
      body.avatar_filename = files.avatar_filename[0].filename;
    }

    return body;
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
}

module.exports = OrganizationService;