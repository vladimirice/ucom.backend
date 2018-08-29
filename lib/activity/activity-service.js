const ActivityUserPostRepository = require('./activity-user-post-repository');
const ActivityDictionary = require('./activity-types-dictionary');
const PostService = require('../posts/post-service');
const EosUsersActivity = require('../eos/eos-users-activity');
const AccountsData = require('../../config/accounts-data');
const models = require('../../models');
const EosPosts = require('../eos/eos-posts');

class ActivityService {
  static async userUpvotesPost(userFrom, postTo) {
    const activityTypeId = ActivityDictionary.getUpvoteId();

    if (!AccountsData.hasOwnProperty(userFrom.account_name)) {
      throw new Error(`There is no user in hardcoded accounts_data with account name: ${userFrom.account_name}`)
    }

    const transactionResult = await models.sequelize
      .transaction(async transaction => {
        await Promise.all([
          ActivityUserPostRepository.createNewActivity(userFrom.id, postTo.id, activityTypeId, transaction),
          PostService.incrementPostVote(postTo.id, transaction)
        ]);

        return true;
      });

    if (process.env.NODE_ENV === 'production' && transactionResult === true) {
    // if (process.env.NODE_ENV === 'development' && transactionResult === true) {
      const senderData = AccountsData[userFrom.account_name];

      await EosUsersActivity.sendContentUpvoting(senderData, postTo.blockchain_id, ActivityDictionary.getUpvoteId());
    } else {
      console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
    }
  }

  static async doesUserVotePost(userIdFrom, postIdTo) {
    return await ActivityUserPostRepository.doesUserVotePost(userIdFrom, postIdTo);
  }

  static async userCreatesMediaPost(userFrom, postTo) {
    const senderData = ActivityService.getSenderData(userFrom.account_name);
    await EosPosts.createPost(senderData, postTo.blockchain_id, postTo.post_type_id);
  }

  static getSenderData(accountName) {
    if (!AccountsData.hasOwnProperty(accountName)) {
      throw new Error(`There is no user in hardcoded accounts_data with account name: ${accountName}`)
    }

    return AccountsData[accountName];
  }

}

module.exports = ActivityService;