const ActivityUserPostRepository = require('./activity-user-post-repository');
const ActivityUserUserRepository = require('./activity-user-user-repository');
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
   * @param {number} userIdTo
   * @returns {Promise<void>} created activity model
   */
  static async userFollowsUser(userFrom, userIdTo) {
    if(userFrom.id === userIdTo) {
      throw new BadRequestError(`It is not possible to follow yourself`, 400);
    }

    const userTo = await UsersRepository.findOneById(userIdTo);

    if (await ActivityService.doesUserFollowsUser(userFrom.id, userIdTo)) {
      throw new BadRequestError(`It is not possible to follow twice`, 400);
    }

    const activityTypeId = ActivityDictionary.getFollowId();

    const newActivity = await ActivityUserUserRepository.createNewActivity(userFrom.id, userIdTo, activityTypeId);

    if (!this.mustSendToBlockchain()) {
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
      await this.setBlockchainStatusNotRequired(newActivity);
      return newActivity;
    }

    const senderData = ActivityService.getSenderData(userFrom);
    await EosUsersActivity.sendUserUserActivity(senderData, userTo.account_name, activityTypeId);
    await this.setBlockchainStatusIsSent(newActivity);

    return newActivity;
  }

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

  static async userUpvotesPost(userFrom, postTo) {
    const activityTypeId = ActivityDictionary.getUpvoteId();

    const transactionResult = await models.sequelize
      .transaction(async transaction => {
        await Promise.all([
          ActivityUserPostRepository.createNewActivity(userFrom.id, postTo.id, activityTypeId, transaction),
          models['posts'].update({ current_vote: models.sequelize.literal('current_vote + 1') }, { where: { id: postTo.id } , transaction})
        ]);

        return true;
      });

    if (process.env.NODE_ENV === 'production' && transactionResult === true) {
    // if (process.env.NODE_ENV === 'development' && transactionResult === true) {
      const senderData = ActivityService.getSenderData(userFrom);

      await EosUsersActivity.sendUserPostActivity(senderData, postTo.blockchain_id, ActivityDictionary.getUpvoteId());
    } else {
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    }
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
   * @deprecated see userCreatesPost
   * @param {Object} userFrom
   * @param {Object} postTo
   * @returns {Promise<void>}
   */
  static async userCreatesMediaPost(userFrom, postTo) {
    const senderData = ActivityService.getSenderData(userFrom);
    await EosPosts.createPost(senderData, postTo.blockchain_id, postTo.post_type_id);
  }

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

  static mustSendToBlockchain() {
    return process.env.NODE_ENV === 'production';
  }

  static async setBlockchainStatusNotRequired(entity) {
    return await entity.update({blockchain_status: BlockchainStatusDictionary.getNotRequiredToSend()})
  }

  static async setBlockchainStatusIsSent(entity) {
    return await entity.update({blockchain_status: BlockchainStatusDictionary.getNotRequiredToSend()})
  }
}

module.exports = ActivityService;