const status = require('statuses');

const EosUsersActivity = require('../eos/eos-users-activity');
const UsersRepository = require('../users/users-repository');
const ActivityUserUserRepository = require('./activity-user-user-repository');
const ActivityDictionary = require('../activity/activity-types-dictionary');
const models = require('../../models');
const EosPosts = require('../eos/eos-posts');
const PostOfferRepository = require('../posts/post-offer/post-offer-repository');
const {BadRequestError} = require('../api/errors');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const EosApi = require('../eos/eosApi');
const { TransactionFactory } = require('uos-app-transaction');
const UserRepository = require('./repository');
const UserActivitySerializer = require('./job/user-activity-serializer');
const ActivityProducer = require('../jobs/activity-producer');


const db = models.sequelize;

class UserActivityService {

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

    await this._userFollowOrUnfollowUser(userFrom, userIdTo, activity_type_id);

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

        const signed = await TransactionFactory.getSignedUserFollowsUser(userFrom.account_name, userFrom.private_key, userToAccountName);

        return await ActivityUserUserRepository.createNewActivity(
          userFrom.id,
          userIdTo,
          activityTypeId,
          JSON.stringify(signed),
          transaction
        );
      });

    await this._sendPayloadToRabbit(activity);

    if (!EosApi.mustSendToBlockchain()) {
      await EosApi.processNotRequiredToSendToBlockchain(activity);

      return true;
    }

    // await EosUsersActivity.sendUserUserActivity(userFrom, userToAccountName, activityTypeId);
    // await EosApi.processIsSendToBlockchain(activity);

    return true;
  }

  static async _sendPayloadToRabbit(activity) {
    const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id);

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