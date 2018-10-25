const models = require('../../../models');
const db = models.sequelize;

const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');

const BlockchainStatusDictionary = require('../../eos/eos-blockchain-status-dictionary');

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
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserFollowsOrgNotification(activityId) {
    const toSelect = [];

    const dataUserAlias = 'data_user';
    const usersAttributes = UsersModelProvider.getUserFieldsForPreview();
    usersAttributes.forEach(attribute => {
      toSelect.push(`${dataUserAlias}.${attribute} AS ${dataUserAlias}__${attribute}`)
    });

    const targetEntityOrgAlias = 'target_entity_org';
    const orgAttributes = OrgModelProvider.getOrgFieldsForPreview();
    orgAttributes.forEach(attribute => {
      toSelect.push(`${targetEntityOrgAlias}.${attribute} AS ${targetEntityOrgAlias}__${attribute}`)
    });

    const selectString = toSelect.join(', ');

    const schema = {
      data: [
        {
          schemaKey:  'User',
          dbKey:      dataUserAlias
        },
      ],
      target_entity: [
        {
          schemaKey: 'organization',
          dbKey:     targetEntityOrgAlias
        }
      ]
    };

    const sql = `
      SELECT ${selectString} from users_activity
        INNER JOIN "Users" AS ${dataUserAlias} 
                        ON ${dataUserAlias}.id = users_activity.user_id_from
        INNER JOIN organizations ${targetEntityOrgAlias} 
                        ON ${targetEntityOrgAlias}.id = users_activity.entity_id_to
        WHERE users_activity.id = ${activityId}
      ;
    `;

    const dbData = await db.query(sql, { type: db.QueryTypes.SELECT });

    if (dbData.length > 1) {
      throw new Error('Query is produced more than one result - not correct. Query is: ', sql);
    }

    return this._arrangeFieldsForNotification(dbData[0], schema);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserFollowsOtherUser(activityId) {
    const toSelect = [];

    const dataUserAlias = 'data_user';
    const usersAttributes = UsersModelProvider.getUserFieldsForPreview();
    usersAttributes.forEach(attribute => {
      toSelect.push(`${dataUserAlias}.${attribute} AS ${dataUserAlias}__${attribute}`)
    });

    const targetEntityUserAlias = 'target_entity_user';
    usersAttributes.forEach(attribute => {
      toSelect.push(`${targetEntityUserAlias}.${attribute} AS ${targetEntityUserAlias}__${attribute}`)
    });

    const selectString = toSelect.join(', ');

    const schema = {
      data: [
        {
          schemaKey:  'User',
          dbKey:      dataUserAlias
        },
      ],
      target_entity: [
        {
          schemaKey: 'User',
          dbKey:     targetEntityUserAlias
        }
      ]
    };

    const sql = `
      SELECT ${selectString} from users_activity
        INNER JOIN "Users" AS ${dataUserAlias} 
                        ON ${dataUserAlias}.id = users_activity.user_id_from
        INNER JOIN "Users" AS ${targetEntityUserAlias} 
                        ON ${targetEntityUserAlias}.id = users_activity.entity_id_to
        WHERE users_activity.id = ${activityId}
      ;
    `;

    const dbData = await db.query(sql, { type: db.QueryTypes.SELECT });

    if (dbData.length > 1) {
      throw new Error('Query is produced more than one result - not correct. Query is: ', sql);
    }

    return this._arrangeFieldsForNotification(dbData[0], schema);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<Object>}
   */
  static async findForOrgTeamInvitation(activityId) {
    const toSelect = [];

    const dataUserAlias = 'data_user';
    const usersAttributes = UsersModelProvider.getUserFieldsForPreview();
    usersAttributes.forEach(attribute => {
      toSelect.push(`${dataUserAlias}.${attribute} AS ${dataUserAlias}__${attribute}`)
    });

    const targetEntityUserAlias = 'target_entity_user';
    usersAttributes.forEach(attribute => {
      toSelect.push(`${targetEntityUserAlias}.${attribute} AS ${targetEntityUserAlias}__${attribute}`)
    });

    const dataOrgAlias = 'data_org';
    const orgAttributes = OrgModelProvider.getOrgFieldsForPreview();
    orgAttributes.forEach(attribute => {
      toSelect.push(`${dataOrgAlias}.${attribute} AS ${dataOrgAlias}__${attribute}`)
    });

    const selectString = toSelect.join(', ');
    // Maybe two steps - save notification + form json
    // model.data.organization
    // model.target_entity.User = activity.entity_id_to
    // model.data.User = activity.user_id_from


    const sql = `
      SELECT ${selectString} from users_activity
        INNER JOIN organizations ${dataOrgAlias} 
                        ON ${dataOrgAlias}.id = users_activity.entity_id_on
        INNER JOIN "Users" AS ${dataUserAlias} 
                        ON ${dataUserAlias}.id = users_activity.user_id_from
        INNER JOIN "Users" ${targetEntityUserAlias} 
                        ON ${targetEntityUserAlias}.id = users_activity.entity_id_to
        WHERE users_activity.id = ${activityId}
      ;
    `;

    const dbData = await db.query(sql, { type: db.QueryTypes.SELECT });

    if (dbData.length > 1) {
      throw new Error('Query is produced more than one result - not correct. Query is: ', sql);
    }

    const schema = {
      data: [
        {
          schemaKey:  'User',
          dbKey:      dataUserAlias
        },
        {
          schemaKey:  'organization',
          dbKey:      dataOrgAlias
        }
      ],
      target_entity: [
        {
          schemaKey: 'User',
          dbKey:     targetEntityUserAlias
        }
      ]
    };


    return this._arrangeFieldsForNotification(dbData[0], schema);
  }

  /**
   *
   * @param {Object} dbData
   * @param {Object} schema
   * @return {{data: {}, target_entity: {}}}
   * @private
   */
  static _arrangeFieldsForNotification(dbData, schema) {
    const res = {
      data: {},
      target_entity: {}
    };

    schema.data.forEach((set) => {
      res.data[set.schemaKey] = {};
    });

    schema.target_entity.forEach((set) => {
      res.target_entity[set.schemaKey] = {};
    });

    for (const field in dbData) {
      schema.data.forEach((set) => {
        if (field.includes(set.dbKey + '__')) {
          const fieldName = field.replace(set.dbKey + '__', '');

          res.data[set.schemaKey][fieldName] = dbData[field];
        }
      });

      schema.target_entity.forEach((set) => {
        if (field.includes(set.dbKey + '__')) {
          const fieldName = field.replace(set.dbKey + '__', '');

          res.target_entity[set.schemaKey][fieldName] = dbData[field];
        }
      });
    }

    return res;
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