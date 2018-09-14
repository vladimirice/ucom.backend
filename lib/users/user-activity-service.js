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

    const activity = await ActivityUserUserRepository.createNewActivity(userFrom.id, userIdTo, activityTypeId);

    if (!EosApi.mustSendToBlockchain()) {
      await EosApi.processNotRequiredToSendToBlockchain(activity);

      return true;
    }

    const userToAccountName = await UsersRepository.findAccountNameById(userIdTo);

    await EosUsersActivity.sendUserUserActivity(userFrom, userToAccountName, activityTypeId);
    await EosApi.processIsSendToBlockchain(activity);

    return true;
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