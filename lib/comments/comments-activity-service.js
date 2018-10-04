const ActivityDictionary = reqlib('/lib/activity/activity-types-dictionary');
const ActivityUserCommentRepository = reqlib('/lib/activity/activity-user-comment-repository');
const EosPosts = require('../eos/eos-posts');
const EosApi = require('../eos/eosApi');
const EosUsersActivity = require('../eos/eos-users-activity');

/**
 * @deprecated - will be completely removed
 * @see UsersActivity
 *
 *
 */
class CommentsActivityService {

  /**
   *
   * @param {Object} userFrom
   * @param {Object} commentTo
   * @returns {Promise<void>}
   */
  static async userUpvotesComment(userFrom, commentTo) {
    const activityTypeId = ActivityDictionary.getUpvoteId();

    return await this._userVotesComment(userFrom, commentTo, activityTypeId);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {Object} commentTo
   * @returns {Promise<void>}
   */
  static async userDownvotesComment(userFrom, commentTo) {
    const activityTypeId = ActivityDictionary.getDownvoteId();

    return await this._userVotesComment(userFrom, commentTo, activityTypeId);
  }

  /**
   *
   * @param {number} user_id_from
   * @param {number} comment_id_to
   * @returns {Promise<boolean>}
   */
  static async doesUserVoteComment(user_id_from, comment_id_to) {
    return await ActivityUserCommentRepository.doesUserVoteComment(user_id_from, comment_id_to);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {string} contentBlockchainId
   * @param {string} parentBlockchainId
   * @returns {Promise<void>}
   */
  static async userCreatesComment(userFrom, contentBlockchainId, parentBlockchainId) {
    const senderData = this._getSenderData(userFrom);

    await EosPosts.createComment(senderData, contentBlockchainId, parentBlockchainId);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {Object} commentTo
   * @param {number} activityTypeId
   * @returns {Promise<void>}
   * @private
   */
  static async _userVotesComment(userFrom, commentTo, activityTypeId) {
    const newActivity = await ActivityUserCommentRepository.createNewActivity(userFrom.id, commentTo.id, activityTypeId);

    if (!EosApi.mustSendToBlockchain()) {
      await EosApi.processNotRequiredToSendToBlockchain(newActivity);
    } else {
      await EosUsersActivity.sendUserContentActivity(userFrom, commentTo.blockchain_id, activityTypeId);
      await EosApi.processIsSendToBlockchain(newActivity);
    }
  }

  /**
   *
   * @param user
   * @returns {{account_name: *, activePk: (Users.private_key|{type}|string)}}
   * @private
   */
  static _getSenderData(user) {
    return {
      'account_name': user.account_name,
      'activePk': user.private_key
    };
  }
}

module.exports = CommentsActivityService;