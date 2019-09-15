import { MyselfDataDto } from '../common/interfaces/post-processing-dto';
import {
  UserIdToUserModelCard, UserModel, UserModelCard, UserModelPreview,
} from './interfaces/model-interfaces';

import NumbersHelper = require('../common/helper/numbers-helper');
import UosAccountsModelProvider = require('../uos-accounts-properties/service/uos-accounts-model-provider');
import UsersModelProvider = require('./users-model-provider');

const _ = require('lodash');
const eosImportance = require('../eos/eos-importance');

const usersRepository = require('./users-repository');

class UserPostProcessor {
  /**
   *
   * @param {Object} model
   * @param {number} currentUserId
   * @param {Object} userActivityData
   */
  static processModelAuthor(model, currentUserId, userActivityData = null) {
    if (!model.User) {
      return;
    }

    this.processUser(model.User, currentUserId, userActivityData);
  }

  /**
   * @deprecated
   * @see processOnlyUserItself
   * @param {Object} user
   */
  public static processModelAuthorForListEntity(user) {
    this.processOnlyUserItself(user);
  }

  /**
   *
   * @param {Object} model
   * @param {string} key
   */
  static processUsersArrayByKey(model, key) {
    const arr = model[key];

    if (!arr) {
      return;
    }

    for (const item of arr) {
      this.processUser(item);
    }
  }

  /**
   *
   * @param {Object} model
   */
  static processUsersTeamArray(model) {
    if (!model.users_team || _.isEmpty(model.users_team)) {
      return;
    }

    model.users_team = model.users_team.map((record) => {
      this.processUser(record.User);

      record.User.users_team_status = record.status;

      return record.User;
    });
  }

  /**
   *
   * @param {Object} user to process
   * @param {number|null} currentUserId - logged user ID
   * @param {Object} activityData
   */
  public static processUser(
    user: UserModel,
    currentUserId: number | null = null,
    activityData: any = null,
  ): void {
    if (!user) {
      return;
    }

    if (activityData) {
      this.addIFollowAndMyFollowers(user, activityData);
      this.addMyselfDataToSingleUser(user, activityData, currentUserId);
    }

    this.processOnlyUserItself(user);
    this.processFollowers(user);
  }

  /**
   * The Goal is to use activityDataSet instead of activityData with data only from users_activity table
   */
  public static processUserWithActivityDataSet(
    user: UserModel,
    currentUserId: number | null = null,
    activityDataSet: any,
  ) {
    this.processUser(user, currentUserId, activityDataSet.activityData);

    if (currentUserId) {
      // @ts-ignore
      user.myselfData.trust = activityDataSet.myselfData.trust;
    }
  }

  public static processUserIdToUserModelCard(modelsSet: UserIdToUserModelCard): void {
    for (const userId in modelsSet) {
      if (modelsSet.hasOwnProperty(userId)) {
        const model = modelsSet[userId];
        this.processOnlyUserItself(model);
      }
    }
  }

  public static processOnlyUserItself(user: UserModel | UserModelCard): void {
    this.normalizeMultiplier(user);
    this.deleteSensitiveData(user);

    this.processUosAccountsProperties(user);
    this.processUsersCurrentParams(user);
  }

  public static processOnlyUserForPreview(user: UserModel): UserModelPreview {
    const fields: string[] = UsersModelProvider.getUserFieldsForPreview();

    const processed: any = {};
    for (const field in user) {
      if (fields.includes(field)) {
        processed[field] = user[field];
      }
    }

    this.processOnlyUserItself(processed);

    return processed;
  }

  /**
   *
   * @param {Object} user
   * @param {Object} activityData
   * @private
   */
  private static addIFollowAndMyFollowers(user, activityData) {
    const attributesToPick = usersRepository.getModel().getFieldsForPreview();

    user.I_follow = [];
    user.followed_by = [];

    activityData.forEach((activity) => {
      const data = _.pick(activity, attributesToPick);
      user[activity.case].push(data);
    });
  }

  /**
   *
   * @param {Object} user
   * @param {Object} activityData
   * @param {number} currentUserId
   * @private
   */
  private static addMyselfDataToSingleUser(user, activityData, currentUserId) {
    if (!currentUserId) {
      return;
    }

    const myselfData: MyselfDataDto = {
      follow: false,
      myFollower: false,
      trust: false,
    };

    activityData.forEach((activity) => {
      if (activity.id === currentUserId) {
        if (activity.case === 'followed_by') {
          myselfData.follow = true;
        } else if (activity.case === 'I_follow') {
          myselfData.myFollower = true;
        }
      }
    });

    user.myselfData = myselfData;
  }

  /**
   *
   * @param {Object[]} users
   * @param {Object} activityData
   */
  static addMyselfFollowDataByActivityArrays(users, activityData) {
    users.forEach((user) => {
      const myselfData = {
        follow: false,
        myFollower: false,
      };

      if (activityData.IFollow.includes(user.id)) {
        myselfData.follow = true;
      }
      if (activityData.myFollowers.includes(user.id)) {
        myselfData.myFollower = true;
      }

      user.myselfData = myselfData;
    });
  }

  public static processUosAccountsProperties(userJson) {
    if (!userJson.uos_accounts_properties) {
      return;
    }

    this.fixSequelizePropsNamingBug(userJson);
    for (const field of UosAccountsModelProvider.getFieldsToSelect()) {
      userJson[field] = NumbersHelper.processFieldToBeNumeric(
        userJson.uos_accounts_properties[field],
        field,
        10,
        false,
        false,
      );
    }

    delete userJson.uos_accounts_properties;
  }

  private static fixSequelizePropsNamingBug(userJson) {
    const replacementMap = {
      current_cumulative_emis: 'current_cumulative_emission',
      current_cumulative_emi: 'current_cumulative_emission',

      previous_cumulative_emi: 'previous_cumulative_emission',
      previous_cumulative_emis: 'previous_cumulative_emission',
    };

    for (const keyToReplace in replacementMap) {
      if (typeof userJson.uos_accounts_properties[keyToReplace] !== 'undefined')  {
        const newKey = replacementMap[keyToReplace];

        userJson.uos_accounts_properties[newKey] = userJson.uos_accounts_properties[keyToReplace];
        delete userJson.uos_accounts_properties[keyToReplace];
      }
    }
  }

  // # is required for sequelize and ORM
  public static processUsersCurrentParams(userJson) {
    if (!userJson.users_current_params) {
      return;
    }

    for (const field of UsersModelProvider.getCurrentParamsToSelect()) {
      userJson[field] = NumbersHelper.processFieldToBeNumeric(
        userJson.users_current_params[field],
        field,
        10,
        false,
        false,
      );
    }

    delete userJson.users_current_params;
  }

  /**
   *
   * @param {Object} user
   * @private
   */
  private static processFollowers(user) {
    if (user.I_follow) {
      user.I_follow.forEach((follower) => {
        this.normalizeMultiplier(follower);
      });
    }

    if (user.followed_by) {
      user.followed_by.forEach((follower) => {
        this.normalizeMultiplier(follower);
      });
    }
  }

  /**
   *
   * @param {Object} user
   * @private
   */
  private static deleteSensitiveData(user) {
    const sensitiveFields = [
      'private_key',
      'blockchain_registration_status',
      'owner_public_key',
      'public_key',
    ];

    sensitiveFields.forEach((field) => {
      delete user[field];
    });
  }

  /**
   * @param {Object} user
   * @private
   */
  private static normalizeMultiplier(user) {
    if (!user) {
      return;
    }

    // Avoid double processing. Bad intermediate solution
    if (typeof user.current_rate !== 'string') {
      return;
    }

    const multiplier = eosImportance.getImportanceMultiplier();

    user.current_rate *= multiplier;

    user.current_rate = +user.current_rate.toFixed();
  }
}

export = UserPostProcessor;
