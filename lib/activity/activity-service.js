const ActivityUserPostRepository = require('./activity-user-post-repository');
const ActivityDictionary = require('./activity-types-dictionary');
const EosUsersActivity = require('../eos/eos-users-activity');
const PostOfferRepository = require('../posts/repository').PostOffer;
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

  static getSenderData(user) {
    return {
      'account_name': user.account_name,
      'activePk': user.private_key
    };
  }
}

module.exports = ActivityService;