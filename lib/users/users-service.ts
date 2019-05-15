/* eslint-disable max-len */
/* tslint:disable:max-line-length */
import { BadRequestError } from '../api/errors';

import UsersFetchService = require('./service/users-fetch-service');
import UsersRepository = require('./users-repository');
import UserPostProcessor = require('./user-post-processor');
import UsersInputProcessor = require('./validator/users-input-processor');
import EosBlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
import UsersModelProvider = require('./users-model-provider');
import UpdateManyToManyHelper = require('../api/helpers/UpdateManyToManyHelper');

const _ = require('lodash');

const models = require('../../models');

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
  public static async findByNameFields(query) {
    return UsersRepository.findByNameFields(query);
  }

  /**
   *
   * @param {Object} req
   * @return {Promise<void>}
   */
  public async processUserUpdating(req) {
    const { body }  = req;
    const { files } = req;

    const requestData = UsersInputProcessor.processWithValidation(body);
    // #task #refactor
    for (const field in requestData) {
      if (requestData[field] === '') {
        requestData[field] = null;
      }
    }

    const userId = this.currentUser.id;
    const user = await UsersRepository.getUserById(userId);

    await UsersService.checkUniqueFields(requestData, userId);

    // #task #refactor
    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files.avatar_filename && files.avatar_filename[0] && files.avatar_filename[0].filename) {
      requestData.avatar_filename = files.avatar_filename[0].filename;
    }

    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files.achievements_filename && files.achievements_filename[0] && files.achievements_filename[0].filename) {
      requestData.achievements_filename = files.achievements_filename[0].filename;
    }

    await models.sequelize
      .transaction(async (transaction) => {
        await UsersService.processArrayFields(user, requestData, transaction);
        await UsersRepository.updateUserById(userId, requestData, transaction);
      });

    const userModel = await UsersRepository.getUserById(userId);
    const userJson = userModel.toJSON();

    UserPostProcessor.processUosAccountsProperties(userJson);

    return userJson;
  }

  /**
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  public async getUserByIdAndProcess(userId) {
    const currentUserId = this.currentUser.id;

    return UsersFetchService.findOneAndProcessFully(userId, currentUserId);
  }

  public static async findOneByAccountName(accountName: string) {
    const user = await models.Users.findOne({ where: { account_name: accountName } });

    UserPostProcessor.processUser(user);

    return user;
  }

  /**
   * @param {Object} query
   * @return {Promise<Object[]>}
   */
  public async findAllAndProcessForList(query) {
    const currentUserId = this.currentUser.id;

    return UsersFetchService.findAllAndProcessForList(query, currentUserId);
  }

  /**
   * @param {string} tagTitle
   * @param {Object} query
   * @return {Promise<Object[]>}
   */
  public async findAllAndProcessForListByTagTitle(tagTitle, query) {
    const currentUserId = this.currentUser.id;

    return UsersFetchService.findAllAndProcessForListByTagTitle(tagTitle, query, currentUserId);
  }

  /**
   *
   * @param {Object} user
   * @param {Object} transaction
   * @return {Promise<void>}
   */
  public static async setBlockchainRegistrationIsSent(user, transaction) {
    await user.update({
      blockchain_registration_status: EosBlockchainStatusDictionary.getStatusIsSent(),
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
  private static async processArrayFields(user, requestData, transaction) {
    const arrayFields = [
      'users_education',
      'users_jobs',
      'users_sources',
    ];

    arrayFields.forEach((field) => {
      // eslint-disable-next-line you-dont-need-lodash-underscore/filter
      requestData[field] = _.filter(requestData[field]);
    });

    requestData.users_sources.forEach((source) => {
      source.source_type_id = source.source_type_id ? source.source_type_id : null;
    });

    for (const field of arrayFields) {
      // eslint-disable-next-line you-dont-need-lodash-underscore/filter
      const set = _.filter(requestData[field]);

      if (!set || _.isEmpty(set)) {
        continue;
      }

      const deltaData = UpdateManyToManyHelper.getCreateUpdateDeleteDelta(user[field], set);

      await UsersService.updateRelations(user, deltaData, field, transaction);
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
  private static async updateRelations(user, deltaData, modelName, transaction) {
    // Update addresses
    await Promise.all([
      deltaData.deleted.map(async (data) => {
        await data.destroy({ transaction });
      }),

      deltaData.added.map(async (data) => {
        data.user_id = user.id;
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
  private static async checkUniqueFields(values, currentUserId) {
    const uniqueFields = UsersModelProvider.getUsersModel().getUsersUniqueFields();

    const toFind = {};
    uniqueFields.forEach((field) => {
      if (values[field]) {
        toFind[field] = values[field];
      }
    });

    const existed = await UsersRepository.findWithUniqueFields(toFind);

    const errors: any = [];
    for (const current of existed) {
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
