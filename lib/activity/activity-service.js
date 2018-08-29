const ActivityUserPostRepository = require('./activity-user-post-repository');
const ActivityDictionary = require('./activity-types-dictionary');
const EosUsersActivity = require('../eos/eos-users-activity');
const models = require('../../models');
const EosPosts = require('../eos/eos-posts');

class ActivityService {
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

      await EosUsersActivity.sendContentUpvoting(senderData, postTo.blockchain_id, ActivityDictionary.getUpvoteId());
    } else {
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    }
  }

  static async doesUserVotePost(userIdFrom, postIdTo) {
    return await ActivityUserPostRepository.doesUserVotePost(userIdFrom, postIdTo);
  }

  static async userCreatesMediaPost(userFrom, postTo) {
    const senderData = ActivityService.getSenderData(userFrom);
    await EosPosts.createPost(senderData, postTo.blockchain_id, postTo.post_type_id);
  }

  static getSenderData(user) {
    return {
      'account_name': user.account_name,
      'activePk': user.private_key
    };
  }
}

module.exports = ActivityService;