const ActivityUserPostRepository = require('./activity-user-post-repository');
const ActivityDictionary = require('./activity-types-dictionary');
const PostService = require('../posts/post-service');
const models = require('../../models');

class ActivityService {
  static async userUpvotesPost(userIdFrom, postId) {
    const activityTypeId = ActivityDictionary.getUpvoteId();

    await models.sequelize
      .transaction(async transaction => {
        await Promise.all([
          ActivityUserPostRepository.createNewActivity(userIdFrom, postId, activityTypeId, transaction),
          PostService.incrementPostVote(postId, transaction)
        ]);

        return true;
      });
  }

  static async doesUserVotePost(userIdFrom, postIdTo) {
    return await ActivityUserPostRepository.doesUserVotePost(userIdFrom, postIdTo);
  }
}

module.exports = ActivityService;