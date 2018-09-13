const models = require('../../models');
const ActivityTypesDictionary = require('../activity/activity-types-dictionary');

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
          activity_type_id: ActivityTypesDictionary.getUpvoteId()
        },
        raw: true
      });
  }

  /**
   *
   * @param {number} userIdFrom
   * @param {number} postIdTo
   * @returns {Promise<Object>}
   */
  static async getUserPostDownvote(userIdFrom, postIdTo) {
    return await ActivityUserPostRepository.getModel()
      .findOne({
        where: {
          user_id_from: userIdFrom,
          post_id_to: postIdTo,
          activity_type_id: ActivityTypesDictionary.getDownvoteId()
        },
        raw: true
      });
  }

  static async getUserPostJoin(userIdFrom, postIdTo) {
    return await ActivityUserPostRepository.getModel()
      .findOne({
        where: {
          user_id_from: userIdFrom,
          post_id_to: postIdTo,
          activity_type_id: ActivityTypesDictionary.getJoinId()
        },
        raw: true
      });
  }

  /**
   *
   * @param {number} user_id_from
   * @param {number} model_id_to
   * @returns {Promise<boolean>}
   */
  static async doesUserVotePost(user_id_from, model_id_to) {
    const sql = `SELECT EXISTS(SELECT 1 FROM ${TABLE_NAME} 
                WHERE user_id_from = $user_id_from AND post_id_to = $model_id_to)
              `;

    const res = await models.sequelize.query(sql, {
      bind: {
        user_id_from,
        model_id_to
      },
      type: models.sequelize.QueryTypes.SELECT
    });

    return res[0]['exists'];
  }

  static getModel() {
    return models[TABLE_NAME];
  }
}

module.exports = ActivityUserPostRepository;