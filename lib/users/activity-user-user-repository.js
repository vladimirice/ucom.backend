const models = require('../../models');
const db = models.sequelize;
const ActivityDictionary = require('../activity/activity-types-dictionary');
const TABLE_NAME = 'activity_user_user';

class ActivityUserUserRepository {
  /**
   * @param {number} user_id_from
   * @param {number} user_id_to
   * @param {number} activity_type_id
   * @returns {Promise<void>}
   */
  static async createNewActivity(user_id_from, user_id_to, activity_type_id) {
    const data = {
      user_id_from,
      user_id_to,
      activity_type_id
    };

    return await this.getModel().create(data);
  }

  /**
   *
   * @param {number} user_id_from
   * @param {number} user_id_to
   * @param {number} activity_type_id
   * @returns {Promise<boolean>}
   */
  static async doesUserFollowAnotherUser(user_id_from, user_id_to, activity_type_id) {
    const sql = `SELECT EXISTS(SELECT 1 FROM ${TABLE_NAME} 
                WHERE user_id_from = $user_id_from AND user_id_to = $user_id_to AND activity_type_id =$activity_type_id)
              `;

    const res = await models.sequelize.query(sql, {
      bind: {
        user_id_from,
        user_id_to,
        activity_type_id
      },
      type: models.sequelize.QueryTypes.SELECT
    });

    return res[0]['exists'];
  }

  static async getLastFollowActivityForUser(userIdFrom, userIdTo) {
    return await ActivityUserUserRepository.getModel()
      .findOne({
        where: {
          user_id_from: userIdFrom,
          user_id_to: userIdTo,
          activity_type_id: ActivityDictionary.getFollowId(),
        },
        raw: true,
        order: [
          ['id', 'DESC']
        ],
      });
  }

  /**
   *
   * @param {number} userIdFrom
   * @param {number} userIdTo
   * @returns {Promise<Object>}
   */
  static async getLastUnfollowActivityForUser(userIdFrom, userIdTo) {
    return await ActivityUserUserRepository.getModel()
      .findOne({
        where: {
          user_id_from: userIdFrom,
          user_id_to: userIdTo,
          activity_type_id: ActivityDictionary.getUnfollowId(),
        },
        raw: true,
        order: [
          ['id', 'DESC']
        ]
      });
  }

  static getModel() {
    return models['activity_user_user'];
  }
}

module.exports = ActivityUserUserRepository;