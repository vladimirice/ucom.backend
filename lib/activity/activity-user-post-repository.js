const models = require('../../models');

const TABLE_NAME = 'activity_user_post';

class ActivityUserPostRepository {
  static async createNewActivity(user_id_from, post_id_to, activity_type_id, transaction) {

    const data = {
      user_id_from,
      post_id_to,
      activity_type_id
    };

    return await ActivityUserPostRepository.getModel().create(data, {
      transaction
    });
  }

  static async getUserPostUpvote(userIdFrom, postIdTo) {
    return await ActivityUserPostRepository.getModel()
      .findOne({
        where: {
          user_id_from: userIdFrom,
          post_id_to: postIdTo,
        },
        raw: true
      });
  }

  // TODO #performance - check EXISTS only
  static async doesUserVotePost(userIdFrom, postIdTo) {
    const result = await ActivityUserPostRepository.getUserPostUpvote(userIdFrom, postIdTo);

    return !!result;
  }

  static getModel() {
    return models[TABLE_NAME];
  }
}

module.exports = ActivityUserPostRepository;