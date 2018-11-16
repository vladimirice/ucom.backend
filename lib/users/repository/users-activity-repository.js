const models = require('../../../models');
const db = models.sequelize;

const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');
const BlockchainStatusDictionary = require('../../eos/eos-blockchain-status-dictionary');

const EventIdDictionary = require('../../entities/dictionary').EventId;

const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const { InteractionTypeDictionary } = require('uos-app-transaction');

const TABLE_NAME = 'users_activity';

class UsersActivityRepository {
  /**
   * @param {Object} data
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async createNewActivity(data, transaction) {
    return this.getModel().create(data, { transaction });
  }

  /**
   *
   * @return {string[]}
   */
  static getAllowedOrderBy() {
    return [
      'id', 'title', 'votes_count', 'votes_amount', 'bp_status'
    ];
  }

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async bulkCreateNewActivity(data, transaction) {
    return this.getModel().bulkCreate(data, { transaction });
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<Object>}
   */
  static async findOneUserBlockchainNodesActivity(userId) {
    const eventIdUp   = EventIdDictionary.getUserVotesForBlockchainNode();
    const eventIdDown = EventIdDictionary.getUserCancelVoteForBlockchainNode();

    const activityTableName   = UsersModelProvider.getUsersActivityTableName();

    const sql = `
      SELECT id, entity_id_to FROM (
                  SELECT
                      DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
                                  entity_name,
                                  activity_type_id,
                                  entity_id_to,
                                  event_id,
                                  id
                  FROM
                       ${activityTableName}
                  WHERE
                      user_id_from  = ${+userId} 
                      AND event_id IN (${eventIdUp}, ${eventIdDown})
                  ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
                  ) AS I_vote
        WHERE
          event_id = ${eventIdUp};
    
    `;

    return await models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
  }

  /**
   *
   * @return {Promise<Object>}
   */
  static async findAllUpvoteUsersBlockchainNodesActivity() {
    const eventIdUp   = EventIdDictionary.getUserVotesForBlockchainNode();
    const eventIdDown = EventIdDictionary.getUserCancelVoteForBlockchainNode();

    const activityTableName   = UsersModelProvider.getUsersActivityTableName();

    const sql = `
      SELECT id, user_id_from, entity_id_to FROM (
                  SELECT
                      DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
                                  entity_name,
                                  activity_type_id,
                                  entity_id_to,
                                  event_id,
                                  user_id_from,
                                  id
                  FROM
                       ${activityTableName}
                  WHERE
                      event_id IN (${eventIdUp}, ${eventIdDown})
                  ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
                  ) AS I_vote
        WHERE
          event_id = ${eventIdUp};
    
    `;

    return await models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
  }
  /**
   *
   * @return {Promise<Object>}
   */
  static async findAllUpvoteCancelUsersBlockchainNodesActivity() {
    const eventIdUp   = EventIdDictionary.getUserVotesForBlockchainNode();
    const eventIdDown = EventIdDictionary.getUserCancelVoteForBlockchainNode();

    const activityTableName   = UsersModelProvider.getUsersActivityTableName();

    const sql = `
      SELECT id, user_id_from, entity_id_to FROM (
                  SELECT
                      DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
                                  entity_name,
                                  activity_type_id,
                                  entity_id_to,
                                  event_id,
                                  user_id_from,
                                  id
                  FROM
                       ${activityTableName}
                  WHERE
                      event_id IN (${eventIdUp}, ${eventIdDown})
                  ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
                  ) AS I_vote
        WHERE
          event_id = ${eventIdDown};
    
    `;

    return await models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
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

  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOnlyItselfById(id) {
    return await this.getModel().findOne({
      where: { id },
      raw: true
    });
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
  static async findOneUserActivityWithInvolvedUsersData(user_id) {
    const activityTypeFollow  = InteractionTypeDictionary.getFollowId();
    const usersTableName      = UsersModelProvider.getUsersTableName();
    const activityTableName   = UsersModelProvider.getUsersActivityTableName();
    const activityGroupId     = ActivityGroupDictionary.getGroupUserUserInteraction();
    const entityName          = UsersModelProvider.getEntityName();

    const sql = `
      SELECT
        CASE
          WHEN user_id_from   = "${usersTableName}".id THEN 'followed_by'
          WHEN entity_id_to   = "${usersTableName}".id THEN 'I_follow'
        END,
        "${usersTableName}".id as id,
         account_name,
         first_name,
         last_name,
         nickname,
         avatar_filename,
         current_rate
      FROM 
        "${usersTableName}"
      INNER JOIN (
        SELECT 
          DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id) 
          id, 
          activity_type_id, 
          user_id_from, 
          entity_id_to
        FROM 
          ${activityTableName}
        WHERE 
          activity_group_id = ${activityGroupId}
          AND entity_name   = '${entityName}'
          AND (user_id_from = ${+user_id} OR entity_id_to = ${+user_id})
        ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
      ) AS I_follow
      ON I_follow.user_id_from = "${usersTableName}".id OR I_follow.entity_id_to = "${usersTableName}".id
      WHERE
        "${usersTableName}".id != ${+user_id}
        AND activity_type_id = ${activityTypeFollow}
      ORDER BY current_rate DESC;
    `;

    return await models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
  }

  static async findOneUserFollowActivity(user_id) {

    const activityTypeFollow  =  InteractionTypeDictionary.getFollowId();
    const activityTypeUnfollow = InteractionTypeDictionary.getUnfollowId();

    const activityTableName   = UsersModelProvider.getUsersActivityTableName();
    const activityGroupId     = ActivityGroupDictionary.getGroupUserUserInteraction();
    const userEntityName      = UsersModelProvider.getEntityName();

    const orgEntityName       = OrgModelProvider.getEntityName();
    const orgActivityGroupId  = ActivityGroupDictionary.getGroupContentInteraction();

    const sql = `
      SELECT entity_id_to, entity_name FROM (
                  SELECT
                      DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
                                  entity_name,
                                  activity_type_id,
                                  entity_id_to
                  FROM
                       ${activityTableName}
                  WHERE
                      user_id_from  = ${+user_id} 
                      AND activity_type_id IN (${activityTypeFollow}, ${activityTypeUnfollow})
                      AND (
                          (activity_group_id = ${+activityGroupId} AND entity_name   = '${userEntityName}')
                        OR 
                          (activity_group_id = ${+orgActivityGroupId} AND entity_name   = '${orgEntityName}')
                      )
                  ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
                  ) AS I_follow
        WHERE
          activity_type_id = ${activityTypeFollow};
    
    `;

    const data = await models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });

    let orgIds    = [];
    let usersIds  = [];

    data.forEach(row => {
      if (row.entity_name === UsersModelProvider.getEntityName()) {
        usersIds.push(+row.entity_id_to);
      } else if (row.entity_name === OrgModelProvider.getEntityName()) {
        orgIds.push(+row.entity_id_to);
      }
    });

    // noinspection JSUnusedGlobalSymbols
    return {
      orgIds,
      usersIds
    };
  }

  /**
   *
   * @param {number} user_id
   * @returns {Promise<any>}
   */
  static async findOneUserActivityData(user_id) {
    const entity_name       = UsersModelProvider.getEntityName();
    const activity_group_id = ActivityGroupDictionary.getGroupUserUserInteraction();

    const sql = `SELECT 
                    DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id) 
                    activity_type_id, 
                    user_id_from, 
                    entity_id_to
                  FROM 
                    "${TABLE_NAME}"
                  WHERE 
                    entity_name           = '${entity_name}' 
                    AND activity_group_id = ${activity_group_id}
                    AND (
                          user_id_from = ${+user_id} OR entity_id_to = ${+user_id}
                        )
                  ORDER BY 
                    user_id_from, entity_id_to, entity_name, activity_group_id,
                    id DESC
                `
    ;

    return await models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
  }

  // noinspection JSUnusedGlobalSymbols
  static async getLastFollowActivityForUser(userIdFrom, userIdTo) {
    return await this.getModel()
      .findOne({
        where: {
          user_id_from:       userIdFrom,
          entity_id_to:       userIdTo,
          entity_name:        UsersModelProvider.getEntityName(),

          activity_type_id:   InteractionTypeDictionary.getFollowId(),
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

          activity_type_id:   InteractionTypeDictionary.getUnfollowId(),
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