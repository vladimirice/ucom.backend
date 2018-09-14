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
   * @param {number} user_id
   * @returns {Promise<any>}
   */
  static async findUserActivityWithInvolvedUsersData(user_id) {

    const activityTypeFollow = ActivityDictionary.getFollowId();

    const sql = `
    SELECT
  CASE
      WHEN user_id_from = "Users".id THEN 'followed_by'
      WHEN user_id_to = "Users".id THEN 'I_follow'
  END,
    "Users".id as id,
   account_name,
   first_name,
   last_name,
   nickname,
   avatar_filename,
   current_rate
FROM "Users"
    INNER JOIN
(SELECT DISTINCT ON (user_id_from, user_id_to) id, activity_type_id, user_id_from, user_id_to
FROM activity_user_user
WHERE user_id_from = ${+user_id} OR user_id_to = ${+user_id}
ORDER BY user_id_from, user_id_to, id DESC) AS I_follow
    ON I_follow.user_id_from = "Users".id OR I_follow.user_id_to = "Users".id
WHERE
    "Users".id != ${+user_id}
  AND activity_type_id = ${activityTypeFollow}
ORDER BY current_rate DESC;
    `;

    const result = await models.sequelize.query(sql);

    return result ? result[0] : null;
  }

  /**
   *
   * @param {number} user_id
   * @returns {Promise<any>}
   */
  static async getUserActivityData(user_id) {
    const sql = `SELECT DISTINCT ON (user_id_from, user_id_to) activity_type_id, user_id_from, user_id_to
                  FROM activity_user_user
                WHERE user_id_from = ${+user_id} OR user_id_to = ${+user_id}
                ORDER BY user_id_from, user_id_to, id DESC;`;

    const result = await models.sequelize.query(sql);

    return result ? result[0]: null;
  }

  /**
   *
   * @param {number} user_id_from
   * @param {number} user_id_to
   * @returns {Promise<number>}
   */
  static async getCurrentFollowCondition(user_id_from, user_id_to) {
    const result = await this.getModel().findOne({
      attributes: ['activity_type_id'],
      where: {
        user_id_from,
        user_id_to
      },
      order: [
        ['id', 'DESC']
      ],
      limit: 1
    });

    return result ? result['activity_type_id'] : null;
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