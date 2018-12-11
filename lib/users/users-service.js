const UsersRepository = require('./users-repository');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const models = require('../../models');
const UserPostProcessor = require('./user-post-processor');
const OrganizationPostProcessor = require('../organizations/service/organization-post-processor');

const UsersActivityRepository = require('./repository').Activity;
const { BadRequestError } = require('../api/errors');

const UsersModelProvider = require('./users-model-provider');

const UsersFetchService = require('./service/users-fetch-service');

const UpdateManyToMany = require('../../lib/api/helpers').UpdateManyToMany;

const Joi = require('joi');
const { JoiBadRequestError } = require('../api/errors');
const _ = require('lodash');

const OrganizationRepository = require('../organizations/repository').Main;
const EntityNotificationRepository = require('../entities/repository').Notifications;
const { UsersUpdatingSchema } = require('../validator').Schemas;

class UsersService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {string} query
   * @returns {Promise<Array<Object>>}
   */
  static async findByNameFields(query) {
    return await UsersRepository.findByNameFields(query);
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<void>}
   */
  async processUserUpdating(req) {
    const body  = req.body;
    const files = req.files;

    const userId = this.currentUser.id;
    let user = await UsersRepository.getUserById(userId);

    // console.log('Patch request body is: ', JSON.stringify(req.body, null, 2));

    let { error, value:requestData } = Joi.validate(body, UsersUpdatingSchema, {
      allowUnknown: true,
      stripUnknown: true,
      abortEarly:   false,
    });

    if (error) {
      throw new JoiBadRequestError(error);
    }

    // TODO #refactor
    for (const field in requestData) {
      if (requestData[field] === '') {
        requestData[field] = null;
      }
    }

    await this._checkUniqueFields(requestData, userId);

    // TODO #refactor
    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files['avatar_filename'] && files['avatar_filename'][0] && files['avatar_filename'][0].filename) {
      requestData['avatar_filename'] = files['avatar_filename'][0].filename;
    }

    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files['achievements_filename'] && files['achievements_filename'][0] && files['achievements_filename'][0].filename) {
      requestData['achievements_filename'] = files['achievements_filename'][0].filename;
    }

    await models.sequelize
      .transaction(async transaction => {
        await this._processArrayFields(user, requestData, transaction);
        await UsersRepository.updateUserById(userId, requestData, transaction);
    });

    return UsersRepository.getUserById(userId);
  }

  /**
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getUserByIdAndProcess(userId) {
    // noinspection JSCheckFunctionSignatures
    const [user, activityData, userOrganizations] = await Promise.all([
      UsersRepository.getUserById(userId),
      UsersActivityRepository.findOneUserActivityWithInvolvedUsersData(userId),
      OrganizationRepository.findAllAvailableForUser(userId)
    ]);

    const userJson = user.toJSON();
    userJson.organizations = userOrganizations;

    UserPostProcessor.processUser(userJson, this.currentUser.id, activityData);
    OrganizationPostProcessor.processManyOrganizations(userJson.organizations);

    if (userId === this.currentUser.id) {
      userJson.unread_messages_count = await EntityNotificationRepository.countUnreadMessages(userId);
    }

    return userJson;
  }

  /**
   *
   * @param {string} account_name
   * @return {Promise<Object>}
   */
  static async findOneByAccountName(account_name) {
    const user = await models['Users'].findOne({where: {account_name}});

    UserPostProcessor.processUser(user);

    return user;
  }

  /**
   * @param {Object} query
   * @return {Promise<Object[]>}
   */
  async findAllAndProcessForList(query) {
    const currentUserId = this.currentUser.id;

    return UsersFetchService.findAllAndProcessForList(query, currentUserId);
  }

  /**
   *
   * @param {Object} user
   * @param {Object} transaction
   * @return {Promise<void>}
   */
  static async setBlockchainRegistrationIsSent(user, transaction) {
    await user.update({
      blockchain_registration_status: BlockchainStatusDictionary.getStatusIsSent()
    }, {
      transaction
    });
  }

  /**
   *
   * @param {Object} user
   * @param {Object} requestData
   * @param {Object} transaction
   * @return {Promise<void>}
   * @private
   */
  async _processArrayFields(user, requestData, transaction) {
    const arrayFields = [
      'users_education',
      'users_jobs',
      'users_sources'
    ];

    arrayFields.forEach(field => {
      requestData[field] = _.filter(requestData[field]);
    });

    requestData.users_sources.forEach(source => {
      source.source_type_id = source.source_type_id ? source.source_type_id : null;
    });

    for (let i = 0; i < arrayFields.length; i++) {
      const field = arrayFields[i];

      let set = _.filter(requestData[field]);

      if (!set || _.isEmpty(set)) {
        continue;
      }

      const deltaData = UpdateManyToMany.getCreateUpdateDeleteDelta(user[field], set);

      await this._updateRelations(user, deltaData, field, transaction);
    }
  }

  /**
   *
   * @param {Object} user
   * @param {Object} deltaData
   * @param {string} modelName
   * @param {Object} transaction
   * @return {Promise<boolean>}
   */
  async _updateRelations(user, deltaData, modelName, transaction) {
    // Update addresses
    await Promise.all([
      deltaData.deleted.map(async data => {
        await data.destroy({ transaction });
      }),

      deltaData.added.map(async data => {

        data['user_id'] = user.id;
        data.is_official = !!data.is_official;

        let newModel = models[modelName].build(data);
        await newModel.save(); // TODO check is transaction work
      }),

      deltaData.changed.map(async data => {
        const toUpdate = user[modelName].find(_data => +_data.id === +data.id);

        data.is_official = !!data.is_official;
        await toUpdate.update(data, { transaction });
      })
    ]);

    return true;
  }

  /**
   *
   * @param   {Object} values
   * @param   {number} currentUserId
   * @return  {Promise<void>}
   * @private
   */
  async _checkUniqueFields(values, currentUserId) {
    const uniqueFields = UsersModelProvider.getUsersModel().getUsersUniqueFields();

    let toFind = {};
    uniqueFields.forEach(field => {
      if (values[field]) {
        toFind[field] = values[field];
      }
    });

    const existed = await UsersRepository.findWithUniqueFields(toFind);

    let errors = [];
    for (let i = 0; i < existed.length; i++) {
      const current = existed[i];

      if (current.id === currentUserId) {
        // this is model itself
        continue;
      }

      uniqueFields.forEach(field => {
        if (current[field] && current[field] === toFind[field]) {
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
}

module.exports = UsersService;