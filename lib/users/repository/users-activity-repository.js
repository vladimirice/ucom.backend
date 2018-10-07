const models = require('../../../models');
const db = models.sequelize;

const ActivityDictionary = require('../../activity/activity-types-dictionary');
const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');

const BlockchainStatusDictionary = require('../../eos/eos-blockchain-status-dictionary');
const UsersModelProvider = require('../../users/users-model-provider');

const TABLE_NAME = 'users_activity';

class UsersActivityRepository {
  /**
   * @param {Object} data
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async createNewActivity(data, transaction) {
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

  /**
   *
   * @param {number} id
   * @param {string} entity_name
   * @return {Promise<*>}
   */
  static async findOneByIdWithRelatedEntityForIpfs(id, entity_name) {
    const relatedTableName = entity_name.trim();
    if (relatedTableName !== 'posts') {
      throw new Error(`Only posts entity name is supported now. Provided entity name is ${entity_name}`);
    }

    const sql = `
        SELECT rel.id as id, rel.title, rel.leading_text, rel.description, rel.user_id FROM ${TABLE_NAME} as t
          INNER JOIN ${relatedTableName} rel ON rel.id = t.entity_id_to
        WHERE t.id = ${+id}
    `;

    // noinspection JSCheckFunctionSignatures
    const result = await db.query(sql, { type: db.QueryTypes.SELECT });

    return result[0];
  }

  /**
   *
   * @param   {number} activity_group_id
   * @param   {number} user_id_from
   * @param   {number} entity_id_to
   * @param   {string} entity_name
   *
   * @returns {Promise<number>}
   */
  static async getCurrentActivity(
    activity_group_id,
    user_id_from,
    entity_id_to,
    entity_name
  ) {
    const result = await this.getModel().findOne({
      attributes: ['activity_type_id'],
      where: {
        activity_group_id,
        user_id_from,
        entity_id_to,
        entity_name
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
   * @param {number} id
   * @return {Promise<*>}
   */
  static async getSignedTransactionByActivityId(id) {
    const result = await this.getModel().findOne({
      attributes: ['signed_transaction'],
      where: { id },
      raw: true,
    });

    return result ? result.signed_transaction : null;
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

  static async findLastByUserIdAndEntityId(user_id_from, entity_id_to) {
    return await this.getModel().findOne({
      where: {
        user_id_from,
        entity_id_to
      },
      raw: true,
      limit: 1,
      order: [
        ['id', 'DESC']
      ]
    })
  }


  static async findLastByUserId(user_id_from) {
    return await this.getModel().findOne({
      where: {
        user_id_from
      },
      raw: true,
      limit: 1,
      order: [
        ['id', 'DESC']
      ]
    })
  }

  static async findEntityRelatedActivityWithInvolvedUsersData(entity_id, entity_name, activity_type_id, activity_group_id) {
    const sql = `
      SELECT
       "Users".id as id,
       account_name,
       first_name,
       last_name,
       nickname,
       avatar_filename,
       current_rate
    FROM "Users"
       INNER JOIN

(SELECT DISTINCT ON (user_id_from, entity_id_to) activity_type_id, activity_group_id, user_id_from
 FROM users_activity
 WHERE entity_id_to = ${+entity_id} AND entity_name = '${entity_name}'
ORDER BY user_id_from, entity_id_to, id DESC) as org_activity
    ON org_activity.user_id_from = "Users".id
WHERE activity_type_id = ${activity_type_id} AND activity_group_id = ${activity_group_id};
      `;

    const result = await models.sequelize.query(sql);

    return result ? result[0] : null;
  }

  // noinspection JSUnusedGlobalSymbols
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

  // noinspection JSUnusedGlobalSymbols
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

  // noinspection JSUnusedGlobalSymbols
  static async getLastFollowActivityForUser(userIdFrom, userIdTo) {
    return await this.getModel()
      .findOne({
        where: {
          user_id_from:       userIdFrom,
          entity_id_to:       userIdTo,
          entity_name:        UsersModelProvider.getEntityName(),

          activity_type_id:   ActivityDictionary.getFollowId(),
          activity_group_id:  ActivityGroupDictionary.getGroupUserUserInteraction(),
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
    return await this.getModel()
      .findOne({
        where: {
          user_id_from:       userIdFrom,
          entity_id_to:       userIdTo,
          entity_name:        UsersModelProvider.getEntityName(),

          activity_type_id:   ActivityDictionary.getUnfollowId(),
          activity_group_id:  ActivityGroupDictionary.getGroupUserUserInteraction(),
        },
        raw: true,
        order: [
          ['id', 'DESC']
        ]
      });
  }

  /**
   *
   * @param {number} userIdFrom
   * @param {number} userIdTo
   * @return {Promise<Object>}
   */
  static async getLastFollowOrUnfollowActivityForUser(userIdFrom, userIdTo) {
    return await this.getModel()
      .findOne({
        where: {
          user_id_from:       userIdFrom,
          entity_id_to:       userIdTo,
          entity_name:        UsersModelProvider.getEntityName(),

          activity_group_id:  ActivityGroupDictionary.getGroupUserUserInteraction(),
        },
        raw: true,
        order: [
          ['id', 'DESC']
        ],
      });
  }


  /**
   *
   * @return {string}
   */
  static getModelName() {
    return TABLE_NAME;
  }

  static getModel() {
    return models[TABLE_NAME];
  }
}

module.exports = UsersActivityRepository;