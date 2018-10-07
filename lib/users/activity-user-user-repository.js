const models = require('../../models');
const ActivityDictionary = require('../activity/activity-types-dictionary');
const TABLE_NAME = 'activity_user_user';
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');

/**
 * @deprecated - will be replaced by universal table users_activity
 * @see UsersActivity
 */
class ActivityUserUserRepository {
  /**
   * @param {number} user_id_from
   * @param {number} user_id_to
   * @param {number} activity_type_id
   * @param {string} signed_transaction
   * @param {Object} transaction
   * @returns {Promise<void>}
   */
  static async createNewActivity(user_id_from, user_id_to, activity_type_id, signed_transaction, transaction) {
    const data = {
      user_id_from,
      user_id_to,
      activity_type_id,
      signed_transaction
    };

    return await this.getModel().create(data, { transaction });
  }

  static async setIsSentToBlockchainAndResponse(id, blockchain_response) {
    const blockchain_status = BlockchainStatusDictionary.getStatusIsSent();

    await this.getModel().update({
      blockchain_status,
      blockchain_response
    }, {
      where: { id }
    })
  }

  static async getSignedTransactionByActivityId(id) {
    const result = await this.getModel().findOne({
      attributes: ['signed_transaction'],
      where: { id },
      raw: true,
    });

    return result ? result['signed_transaction'] : null;
  }

  /**
   *
   * @param {number} user_id_from
   * @returns {Promise<Object>}
   */
  static async findLastWithBlockchainIsSentStatus(user_id_from) {
    const blockchain_status = BlockchainStatusDictionary.getStatusIsSent();

    return await this.getModel().findOne({
      where: {
        user_id_from,
        blockchain_status,
      },
      raw: true,
      limit: 1,
      order: [
        ['id', 'DESC']
      ]
    });
  }

  // noinspection JSUnusedGlobalSymbols
  static async findLastByUserId(user_id) {
    return await this.getModel().findOne({
      where: {
        user_id
      },
      raw: true,
      limit: 1,
      order: [
        ['id', 'DESC']
      ]
    })
  }


  /**
   *
   * @param {number} user_id
   * @returns {Promise<any>}
   */
  static async findUserActivityWithInvolvedUsersData(user_id) {
    // entity_name = 'users'
    // activity_group_type = users interaction

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

  // noinspection JSUnusedGlobalSymbols
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

  static getModel() {
    return models['activity_user_user'];
  }
}

module.exports = ActivityUserUserRepository;