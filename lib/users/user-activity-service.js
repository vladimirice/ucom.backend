const status = require('statuses');

const UsersRepository = require('../users/users-repository');
const ActivityUserUserRepository = require('./activity-user-user-repository');
const ActivityDictionary = require('../activity/activity-types-dictionary');
const models = require('../../models');
const {BadRequestError} = require('../api/errors');
const EosApi = require('../eos/eosApi');
const { TransactionFactory } = require('uos-app-transaction');
const UserActivitySerializer = require('./job/user-activity-serializer');
const ActivityProducer = require('../jobs/activity-producer');
const UsersActivityRepository = require('../users/repository').Activity;
const ContentTypeDictionary = require('../activity/content-type-dictionary');

const db = models.sequelize;

class UserActivityService {

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async processNewOrganization(signedTransaction, currentUserId, newOrganizationId, transaction) {

    const data = {
      activity_type_id: ContentTypeDictionary.getTypeOrganization(),
      user_id_from: currentUserId,
      entity_id_to: newOrganizationId,
      entity_name: 'organization',
      signed_transaction: body.signed_transaction,
    };


    // createSignedUserMakeContent

    const activity = await UsersActivityRepository.createNewActivity(data, transaction);

    await this._sendPayloadToRabbit(activity, 'users_activity');

    return activity;
  }

  /**
   *
   * @param {number | null} user_id
   * @returns {Promise<Array[]>}
   */
  static async getUserActivityData(user_id = null) {
    if (user_id === null) {
      return {
        IFollow: [],
        myFollowers: [],
      }
    }

    const data = await ActivityUserUserRepository.getUserActivityData(user_id);

    let IFollow = [];
    let myFollowers = [];
    data.forEach(activity => {
      if (ActivityDictionary.isFollowActivity(activity)) {
        if (activity.user_id_from === user_id) {
          IFollow.push(activity.user_id_to);
        } else if (activity.user_id_to === user_id) {
          myFollowers.push(activity.user_id_from);
        }
      }
    });

    return {
      IFollow,
      myFollowers
    };
  }

  /**
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @returns {Promise<void>} created activity model
   */
  static async userFollowsAnotherUser(userFrom, userIdTo) {
    const activityTypeId = ActivityDictionary.getFollowId();

    await this._userFollowOrUnfollowUser(userFrom,userIdTo, activityTypeId);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @returns {Promise<void>}
   */
  static async userUnfollowsUser(userFrom, userIdTo) {
    const activity_type_id = ActivityDictionary.getUnfollowId();

    const activity = await this._userFollowOrUnfollowUser(userFrom, userIdTo, activity_type_id);
  }


  static async createAndSignTransaction(userFrom, ) {
    const signed = await TransactionFactory._getSignedUserToUser(
      userFrom.account_name,
      userFrom.private_key,
      userToAccountName,
      activityTypeId
    );

  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {number} activityTypeId
   * @returns {Promise<boolean>}
   * @private
   */
  static async _userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId) {
    await this._checkPreconditions(userFrom, userIdTo, activityTypeId);

    const userToAccountName = await UsersRepository.findAccountNameById(userIdTo);

    const activity = await db
      .transaction(async transaction => {

        const signed = await TransactionFactory._getSignedUserToUser(
          userFrom.account_name,
          userFrom.private_key,
          userToAccountName,
          activityTypeId
        );

        return await ActivityUserUserRepository.createNewActivity(
          userFrom.id,
          userIdTo,
          activityTypeId,
          JSON.stringify(signed),
          transaction
        );
      });

    await this._sendPayloadToRabbit(activity, 'activity_user_user');

    // if (!EosApi.mustSendToBlockchain()) {
    //   await EosApi.processNotRequiredToSendToBlockchain(activity);
    //
    //   return true;
    // }

    // await EosUsersActivity.sendUserUserActivity(userFrom, userToAccountName, activityTypeId);
    // await EosApi.processIsSendToBlockchain(activity);

    return true;
  }

  /**
   *
   * @param activity
   * @param scope
   * @return {Promise<void>}
   * @private
   */
  static async _sendPayloadToRabbit(activity, scope) {
    const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id, scope);

    await ActivityProducer.publishWithUserActivity(jsonPayload);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {number} activityTypeId
   * @returns {Promise<void>}
   * @private
   */
  static async _checkPreconditions(userFrom, userIdTo, activityTypeId) {
    if (userFrom.id === userIdTo) {
      throw new BadRequestError({
        'general': 'It is not possible to follow yourself'
      }, status('400'));
    }

    const currentFollowStatus = await ActivityUserUserRepository.getCurrentFollowCondition(userFrom.id, userIdTo);

    if (currentFollowStatus === activityTypeId) {
      throw new BadRequestError({
        'general': 'It is not possible to follow/unfollow twice'
      }, status('400'));
    }

    if (!ActivityDictionary.isOppositeActivityRequired(activityTypeId)) {
      return;
    }

    if (!currentFollowStatus || currentFollowStatus !== ActivityDictionary.getOppositeFollowActivityTypeId(activityTypeId)) {
      throw new BadRequestError({
        'general': 'It is not possible to unfollow before follow'
      }, status('400'));
    }
  }
}

module.exports = UserActivityService;