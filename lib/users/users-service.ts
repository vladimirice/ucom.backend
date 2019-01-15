/* tslint:disable:max-line-length */
const usersRepository = require('./users-repository');
const blockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const models = require('../../models');
const userPostProcessor = require('./user-post-processor');
const organizationPostProcessor = require('../organizations/service/organization-post-processor');

const usersActivityRepository = require('./repository').Activity;
const { BadRequestError } = require('../api/errors');

const usersModelProvider = require('./users-model-provider');

const usersFetchService = require('./service/users-fetch-service');

const UpdateManyToMany = require('../../lib/api/helpers').UpdateManyToMany;

const joi = require('joi');
const { JoiBadRequestError } = require('../api/errors');
const _ = require('lodash');

const organizationRepository = require('../organizations/repository').Main;
const entityNotificationRepository = require('../entities/repository').Notifications;
const { UsersUpdatingSchema } = require('../validator').Schemas;

class UsersService {
  private currentUser: any;

  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {string} query
   * @returns {Promise<Array<Object>>}
   */
  static async findByNameFields(query) {
    return await usersRepository.findByNameFields(query);
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
    const user = await usersRepository.getUserById(userId);

    // console.log('Patch request body is: ', JSON.stringify(req.body, null, 2));

    const { error, value:requestData } = joi.validate(body, UsersUpdatingSchema, {
      allowUnknown: true,
      stripUnknown: true,
      abortEarly:   false,
    });

    if (error) {
      throw new JoiBadRequestError(error);
    }

    // #task #refactor
    for (const field in requestData) {
      if (requestData[field] === '') {
        requestData[field] = null;
      }
    }

    await this.checkUniqueFields(requestData, userId);

    // #task #refactor
    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files['avatar_filename'] && files['avatar_filename'][0] && files['avatar_filename'][0].filename) {
      requestData['avatar_filename'] = files['avatar_filename'][0].filename;
    }

    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files['achievements_filename'] && files['achievements_filename'][0] && files['achievements_filename'][0].filename) {
      requestData['achievements_filename'] = files['achievements_filename'][0].filename;
    }

    await models.sequelize
      .transaction(async (transaction) => {
        await this.processArrayFields(user, requestData, transaction);
        await usersRepository.updateUserById(userId, requestData, transaction);
      });

    return usersRepository.getUserById(userId);
  }

  /**
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getUserByIdAndProcess(userId) {
    // noinspection JSCheckFunctionSignatures
    const [user, activityData, userOrganizations] = await Promise.all([
      usersRepository.getUserById(userId),
      usersActivityRepository.findOneUserActivityWithInvolvedUsersData(userId),
      organizationRepository.findAllAvailableForUser(userId),
    ]);

    const userJson = user.toJSON();
    userJson.organizations = userOrganizations;

    userPostProcessor.processUser(userJson, this.currentUser.id, activityData);
    organizationPostProcessor.processManyOrganizations(userJson.organizations);

    if (userId === this.currentUser.id) {
      userJson.unread_messages_count = await entityNotificationRepository.countUnreadMessages(userId);
    }

    return userJson;
  }

  static async findOneByAccountName(accountName: string) {
    const user = await models['Users'].findOne({ where: { account_name: accountName } });

    userPostProcessor.processUser(user);

    return user;
  }

  /**
   * @param {Object} query
   * @return {Promise<Object[]>}
   */
  async findAllAndProcessForList(query) {
    const currentUserId = this.currentUser.id;

    return usersFetchService.findAllAndProcessForList(query, currentUserId);
  }

  /**
   * @param {string} tagTitle
   * @param {Object} query
   * @return {Promise<Object[]>}
   */
  async findAllAndProcessForListByTagTitle(tagTitle, query) {
    const currentUserId = this.currentUser.id;

    return usersFetchService.findAllAndProcessForListByTagTitle(tagTitle, query, currentUserId);
  }

  /**
   *
   * @param {Object} user
   * @param {Object} transaction
   * @return {Promise<void>}
   */
  static async setBlockchainRegistrationIsSent(user, transaction) {
    await user.update({
      blockchain_registration_status: blockchainStatusDictionary.getStatusIsSent(),
    },                {
      transaction,
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
  private async processArrayFields(user, requestData, transaction) {
    const arrayFields = [
      'users_education',
      'users_jobs',
      'users_sources',
    ];

    arrayFields.forEach((field) => {
      requestData[field] = _.filter(requestData[field]);
    });

    requestData.users_sources.forEach((source) => {
      source.source_type_id = source.source_type_id ? source.source_type_id : null;
    });

    for (let i = 0; i < arrayFields.length; i += 1) {
      const field = arrayFields[i];

      const set = _.filter(requestData[field]);

      if (!set || _.isEmpty(set)) {
        continue;
      }

      const deltaData = UpdateManyToMany.getCreateUpdateDeleteDelta(user[field], set);

      await this.updateRelations(user, deltaData, field, transaction);
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
  async updateRelations(user, deltaData, modelName, transaction) {
    // Update addresses
    await Promise.all([
      deltaData.deleted.map(async (data) => {
        await data.destroy({ transaction });
      }),

      deltaData.added.map(async (data) => {

        data['user_id'] = user.id;
        data.is_official = !!data.is_official;

        const newModel = models[modelName].build(data);
        await newModel.save(); // #task check is transaction work
      }),

      deltaData.changed.map(async (data) => {
        const toUpdate = user[modelName].find(innerData => +innerData.id === +data.id);

        data.is_official = !!data.is_official;
        await toUpdate.update(data, { transaction });
      }),
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
  private async checkUniqueFields(values, currentUserId) {
    const uniqueFields = usersModelProvider.getUsersModel().getUsersUniqueFields();

    const toFind = {};
    uniqueFields.forEach((field) => {
      if (values[field]) {
        toFind[field] = values[field];
      }
    });

    const existed = await usersRepository.findWithUniqueFields(toFind);

    const errors: any = [];
    for (let i = 0; i < existed.length; i += 1) {
      const current = existed[i];

      if (current.id === currentUserId) {
        // this is model itself
        continue;
      }

      uniqueFields.forEach((field) => {
        if (current[field] && current[field] === toFind[field]) {
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
}

export = UsersService;
