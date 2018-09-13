const ActivityDictionary = reqlib('/lib/activity/activity-types-dictionary');
const ActivityUserPostRepository = reqlib('/lib/activity/activity-user-post-repository');
const EosApi = require('../eos/eosApi');
const EosUsersActivity = require('../eos/eos-users-activity');

class PostActivityService {
  /**
   *
   * @param {number} user_id_from
   * @param {number} comment_id_to
   * @returns {Promise<boolean>}
   */
  static async doesUserVotePost(user_id_from, comment_id_to) {
    return await ActivityUserPostRepository.doesUserVotePost(user_id_from, comment_id_to);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {Object} postTo
   * @returns {Promise<*>}
   */
  static async userUpvotesPost(userFrom, postTo) {
    const activityTypeId = ActivityDictionary.getUpvoteId();

    return await this._userVotesPost(userFrom, postTo, activityTypeId);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {Object} postTo
   * @returns {Promise<*>}
   */
  static async userDownvotesPost(userFrom, postTo) {
    const activityTypeId = ActivityDictionary.getDownvoteId();

    return await this._userVotesPost(userFrom,postTo, activityTypeId);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {Object} modelTo
   * @param {number} activityTypeId
   * @returns {Promise<*>}
   * @private
   */
  static async _userVotesPost(userFrom, modelTo, activityTypeId) {
    const activity = await ActivityUserPostRepository.createNewActivity(userFrom.id, modelTo.id, activityTypeId);

    if (!EosApi.mustSendToBlockchain()) {
      await EosApi.processNotRequiredToSendToBlockchain(activity);

      return;
    }

    await EosUsersActivity.sendUserContentActivity(userFrom, modelTo.blockchain_id, activityTypeId);
    await EosApi.processIsSendToBlockchain(activity);
  }
}

module.exports = PostActivityService;