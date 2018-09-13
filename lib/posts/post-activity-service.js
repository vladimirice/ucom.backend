const ActivityDictionary = reqlib('/lib/activity/activity-types-dictionary');
const ActivityUserPostRepository = reqlib('/lib/activity/activity-user-post-repository');
const EosPosts = require('../eos/eos-posts');
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
   * @returns {Promise<void>}
   */
  static async userUpvotesPost(userFrom, postTo) {
    const activityTypeId = ActivityDictionary.getUpvoteId();

    await ActivityUserPostRepository.createNewActivity(userFrom.id, postTo.id, activityTypeId);

    // TODO send to blockchain
    // if (process.env.NODE_ENV === 'production' && transactionResult === true) {
    //   // if (process.env.NODE_ENV === 'development' && transactionResult === true) {
    //   const senderData = ActivityService.getSenderData(userFrom);
    //
    //   await EosUsersActivity.sendUserPostActivity(senderData, postTo.blockchain_id, ActivityDictionary.getUpvoteId());
    // } else {
    //   console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    // }
  }

  static async userDownvotesPost(userFrom, postTo) {
    const activityTypeId = ActivityDictionary.getDownvoteId();

    await ActivityUserPostRepository.createNewActivity(userFrom.id, postTo.id, activityTypeId);

    // TODO send to blockchain
    // if (process.env.NODE_ENV === 'production' && transactionResult === true) {
    //   // if (process.env.NODE_ENV === 'development' && transactionResult === true) {
    //   const senderData = ActivityService.getSenderData(userFrom);
    //
    //   await EosUsersActivity.sendUserPostActivity(senderData, postTo.blockchain_id, ActivityDictionary.getUpvoteId());
    // } else {
    //   console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    // }
  }
}

module.exports = PostActivityService;