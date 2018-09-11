const models = require('../../models');
const ActivityTypesDictionary = require('../activity/activity-types-dictionary');

const TABLE_NAME = 'activity_user_comment';

class ActivityUserCommentRepository {
  static async createNewActivity(user_id_from, comment_id_to, activity_type_id, transaction) {

    const data = {
      user_id_from,
      comment_id_to,
      activity_type_id
    };

    return await this.getModel().create(data, {
      transaction
    });
  }

  /**
   *
   * @param {number} user_id_from
   * @param {number} comment_id_to
   * @returns {Promise<Object>}
   */
  static async getUserCommentUpvote(user_id_from, comment_id_to) {
    const activity_type_id = ActivityTypesDictionary.getUpvoteId();

    return await this.getModel()
      .findOne({
        where: {
          user_id_from,
          comment_id_to,
          activity_type_id
        },
        raw: true
      });
  }

  static async doesUserVoteComment(user_id_from, comment_id_to) {
    const result = await this.getModel().count({
      where: {
        user_id_from,
        comment_id_to
      }
    });

    return !!result;
  }

  static getModel() {
    return models[TABLE_NAME];
  }
}

module.exports = ActivityUserCommentRepository;