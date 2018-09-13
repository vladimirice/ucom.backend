const status = require('statuses');

const ActivityUserPostRepository = require('./activity-user-post-repository');
const ActivityUserCommentRepository = require('./activity-user-comment-repository');
const ActivityDictionary = require('./activity-types-dictionary');
const EosUsersActivity = require('../eos/eos-users-activity');
const UsersRepository = require('../users/users-repository');
const models = require('../../models');
const EosPosts = require('../eos/eos-posts');
const PostOfferRepository = require('../posts/post-offer/post-offer-repository');
const {BadRequestError} = require('../api/errors');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');

class ActivityService {

  /**
   * @param {Object} userFrom
   * @param {number} postId
   * @returns {Promise<void>} created Activity model
   */
  static async userJoinsPost(userFrom, postId) {
    const postTo = await PostOfferRepository.findOneById(postId);

    if (!postTo) {
      throw new BadRequestError(`There is no offer-post with ID: ${postId}`, 404);
    }

    const activityTypeId = ActivityDictionary.getJoinId();

    const newActivity = await ActivityUserPostRepository.createNewActivity(userFrom.id, postTo.id, activityTypeId);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
      await newActivity.update({blockchain_status: BlockchainStatusDictionary.getNotRequiredToSend()});
      return;
    }

    const senderData = ActivityService.getSenderData(userFrom);
    await EosUsersActivity.sendUserPostActivity(senderData, postTo.blockchain_id, activityTypeId);
    await newActivity.update({blockchain_status: BlockchainStatusDictionary.getStatusIsSent()});
  }

  static async doesUserVotePost(userIdFrom, postIdTo) {
    return await ActivityUserPostRepository.doesUserVotePost(userIdFrom, postIdTo);
  }

  /**
   *
   * @param {integer} userIdFrom
   * @param {integer} userIdTo
   * @returns {Promise<*>} boolean
   */
  static async doesUserFollowsUser(userIdFrom, userIdTo) {
    return await ActivityUserUserRepository.doesUserFollowUser(userIdFrom, userIdTo);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {Object} postTo
   * @returns {Promise<void>}
   */
  static async userCreatesPost(userFrom, postTo) {
    const senderData = ActivityService.getSenderData(userFrom);
    await EosPosts.createPost(senderData, postTo.blockchain_id, postTo.post_type_id);
  }

  static getSenderData(user) {
    return {
      'account_name': user.account_name,
      'activePk': user.private_key
    };
  }

  /**
   * @deprecated
   * @see eosApi.mustSendToBlockchain
   * @returns {boolean}
   */
  static mustSendToBlockchain() {
    return process.env.NODE_ENV === 'production';
  }

  static async setBlockchainStatusNotRequired(entity) {
    return await entity.update({blockchain_status: BlockchainStatusDictionary.getNotRequiredToSend()})
  }

  static async setBlockchainStatusIsSent(entity) {
    return await entity.update({blockchain_status: BlockchainStatusDictionary.getStatusIsSent()})
  }
  static async setBlockchainStatusIsError(entity) {
    return await entity.update({blockchain_status: BlockchainStatusDictionary.getSendingErrorStatus()})
  }
}

module.exports = ActivityService;