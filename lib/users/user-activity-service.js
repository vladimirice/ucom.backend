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
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @returns {Promise<void>} created activity model
   */
  static async userFollowsAnotherUser(userFrom, userIdTo) {
    const activityTypeId = ActivityDictionary.getFollowId();

    return this._userFollowOrUnfollowUser(userFrom,userIdTo, activityTypeId);
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
    if(userFrom.id === userIdTo) {
      throw new BadRequestError({
        'general': 'It is not possible to follow yourself'
      }, status('400'));
    }

    if (await ActivityUserUserRepository.doesUserFollowAnotherUser(userFrom.id, userIdTo, activityTypeId)) {
      throw new BadRequestError({
        'general': 'It is not possible to follow/unfollow twice'
      }, status('400'));
    }

    if (!ActivityDictionary.isOppositeActivityRequired(activityTypeId)) {
      return;
    }

    const sameButOppositeActivity = await ActivityUserUserRepository.doesUserFollowAnotherUser(
      userFrom.id,
      userIdTo,
      ActivityDictionary.getOppositeFollowActivityTypeId(activityTypeId),
    );

    if (!sameButOppositeActivity) {
      throw new BadRequestError({
        'general': 'It is possible to unfollow if you follow beforehand and vice versa'
      }, status('400'));
    }
  }
}

module.exports = UserActivityService;