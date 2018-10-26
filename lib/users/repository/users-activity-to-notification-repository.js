const models = require('../../../models');
const db = models.sequelize;

const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;
const CommentsModelProvider    = require('../../comments/service').ModelProvider;
const PostsModelProvider    = require('../../posts/service').ModelProvider;

class UsersActivityToNotificationRepository {

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserCreatesCommentForComment(activityId) {
    const dataAttributes = {
      table_name:               CommentsModelProvider.getTableName(),
      entity_name:              CommentsModelProvider.getEntityName(),
      schema_key:               CommentsModelProvider.getCommentsSingularName(),
      related_activity_column:  'entity_id_to',
      data_alias:               'data',
    };

    const targetAttributes = {
      table_name:               CommentsModelProvider.getTableName(),
      entity_name:              CommentsModelProvider.getEntityName(),
      schema_key:               CommentsModelProvider.getCommentsSingularName(),
      related_activity_column:  'entity_id_on',
      data_alias:               'target_entity',
    };

    const schema = {
      data: [
        {
          schemaKey:    dataAttributes.schema_key,
          dbKey:        dataAttributes.data_alias,
          dbAuthorKey:  dataAttributes.data_alias + '_author',
        },
      ],
      target_entity: [
        {
          schemaKey:    targetAttributes.schema_key,
          dbKey:        targetAttributes.data_alias,
          dbAuthorKey:  targetAttributes.data_alias + '_author',
        }
      ]
    };

    return this._findForNotification(dataAttributes, targetAttributes, schema, activityId);
  }

  /*
    what about organization activity - you should add to post not only author but also organization
    same for comment on comment
   */

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserCreatesCommentForPost(activityId) {
    const dataAttributes = {
      table_name:               CommentsModelProvider.getTableName(),
      entity_name:              CommentsModelProvider.getEntityName(),
      schema_key:               CommentsModelProvider.getCommentsSingularName(),
      related_activity_column:  'entity_id_to',
      data_alias:               'data',
    };

    const targetAttributes = {
      table_name:               PostsModelProvider.getTableName(),
      entity_name:              PostsModelProvider.getEntityName(),
      schema_key:               PostsModelProvider.getPostsSingularName(),
      related_activity_column:  'entity_id_on',
      data_alias:               'target_entity',
    };

    const schema = {
      data: [
        {
          schemaKey:    dataAttributes.schema_key,
          dbKey:        dataAttributes.data_alias,
          dbAuthorKey:  dataAttributes.data_alias + '_author',
        },
      ],
      target_entity: [
        {
          schemaKey:    targetAttributes.schema_key,
          dbKey:        targetAttributes.data_alias,
          dbAuthorKey:  targetAttributes.data_alias + '_author',
        }
      ]
    };

    return this._findForNotification(dataAttributes, targetAttributes, schema, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserCreatesCommentForOrgPost(activityId) {
    const dataAttributes = {
      table_name:               CommentsModelProvider.getTableName(),
      entity_name:              CommentsModelProvider.getEntityName(),
      schema_key:               CommentsModelProvider.getCommentsSingularName(),
      related_activity_column:  'entity_id_to',
      data_alias:               'data',
    };

    const targetAttributes = {
      table_name:               PostsModelProvider.getTableName(),
      entity_name:              PostsModelProvider.getEntityName(),
      schema_key:               PostsModelProvider.getPostsSingularName(),
      related_activity_column:  'entity_id_on',
      data_alias:               'target_entity',
    };

    const schema = {
      data: [
        {
          schemaKey:    dataAttributes.schema_key,
          dbKey:        dataAttributes.data_alias,
          dbAuthorKey:  dataAttributes.data_alias + '_author',
          // for comment it is not required to fetch organization
        },
      ],
      target_entity: [
        {
          schemaKey:    targetAttributes.schema_key,
          dbKey:        targetAttributes.data_alias,
          dbAuthorKey:  targetAttributes.data_alias + '_author',
          dbOrgKey:     targetAttributes.data_alias + '_org',
        }
      ]
    };

    return this._findForNotification(dataAttributes, targetAttributes, schema, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserCreatesCommentForOrgComment(activityId) {
    const dataAttributes = {
      table_name:               CommentsModelProvider.getTableName(),
      entity_name:              CommentsModelProvider.getEntityName(),
      schema_key:               CommentsModelProvider.getCommentsSingularName(),
      related_activity_column:  'entity_id_to',
      data_alias:               'data',
    };

    const targetAttributes = {
      table_name:               CommentsModelProvider.getTableName(),
      entity_name:              CommentsModelProvider.getEntityName(),
      schema_key:               CommentsModelProvider.getCommentsSingularName(),
      related_activity_column:  'entity_id_on',
      data_alias:               'target_entity',
    };

    const schema = {
      data: [
        {
          schemaKey:    dataAttributes.schema_key,
          dbKey:        dataAttributes.data_alias,
          dbAuthorKey:  dataAttributes.data_alias + '_author',
          // for comment it is not required to fetch organization
        },
      ],
      target_entity: [
        {
          schemaKey:    targetAttributes.schema_key,
          dbKey:        targetAttributes.data_alias,
          dbAuthorKey:  targetAttributes.data_alias + '_author',
          dbOrgKey:     targetAttributes.data_alias + '_org',
        }
      ]
    };

    return this._findForNotification(dataAttributes, targetAttributes, schema, activityId);
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
      throw new Error(`Query is produced more than one result - not correct. Query is: ${sql}`);
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
      throw new Error(`Query is produced more than one result - not correct. Query is: ${sql}`);
    }

    return this._arrangeFieldsForNotification(dbData[0], schema);
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
      throw new Error(`Query is produced more than one result - not correct. Query is: ${sql}`);
    }

    return this._arrangeFieldsForNotification(dbData[0], schema);
  }


  /**
   *
   * @param {Object} dataAttributes
   * @param {Object} targetAttributes
   * @param {Object} schema
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   * @private
   */
  static async _findForNotification(dataAttributes, targetAttributes, schema, activityId) {
    const toSelect = [];

    this._addToSelectArrayByAlias(dataAttributes.data_alias, dataAttributes.table_name, toSelect);
    this._addToSelectArrayByAlias(targetAttributes.data_alias, targetAttributes.table_name, toSelect);

    const selectString = toSelect.join(', ');

    let sql = `SELECT ${selectString} from users_activity`;

    sql += ' ' + this._addRequiredJoin(dataAttributes.table_name, dataAttributes.data_alias, dataAttributes.related_activity_column);
    sql += ' ' + this._addRequiredJoin(targetAttributes.table_name, targetAttributes.data_alias, targetAttributes.related_activity_column);

    sql += ` WHERE users_activity.id = ${+activityId}`;

    const dbData = await db.query(sql, { type: db.QueryTypes.SELECT });

    if (dbData.length > 1) {
      throw new Error(`Query is produced more than one result - not correct. Query is: ${sql}`);
    }

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

      if (set.dbAuthorKey) {
        res.data[set.schemaKey].User = {};
      }

      if (set.dbOrgKey) {
        res.data[set.schemaKey].organization = {};
      }
    });

    schema.target_entity.forEach((set) => {
      res.target_entity[set.schemaKey] = {};

      if (set.dbAuthorKey) {
        res.target_entity[set.schemaKey].User = {};
      }

      if (set.dbOrgKey) {
        res.target_entity[set.schemaKey].organization = {};
      }
    });

    for (const field in dbData) {
      schema.data.forEach((set) => {
        if (field.includes(set.dbKey + '__')) {
          const fieldName = field.replace(set.dbKey + '__', '');

          res.data[set.schemaKey][fieldName] = dbData[field];
        }

        if (set.dbAuthorKey && field.includes(set.dbAuthorKey + '__')) {
          const fieldName = field.replace(set.dbAuthorKey + '__', '');

          res.data[set.schemaKey].User[fieldName] = dbData[field];
        }

        if (set.dbOrgKey && field.includes(set.dbOrgKey + '__')) {
          const fieldName = field.replace(set.dbOrgKey + '__', '');

          res.data[set.schemaKey].organization[fieldName] = dbData[field];
        }
      });

      schema.target_entity.forEach((set) => {
        if (field.includes(set.dbKey + '__')) {
          const fieldName = field.replace(set.dbKey + '__', '');

          res.target_entity[set.schemaKey][fieldName] = dbData[field];
        }
        if (set.dbAuthorKey && field.includes(set.dbAuthorKey + '__')) {
          const fieldName = field.replace(set.dbAuthorKey + '__', '');

          res.target_entity[set.schemaKey].User[fieldName] = dbData[field];
        }

        if (set.dbOrgKey && field.includes(set.dbOrgKey + '__')) {
          const fieldName = field.replace(set.dbOrgKey + '__', '');

          res.target_entity[set.schemaKey].organization[fieldName] = dbData[field];
        }
      });
    }

    return res;
  }

  /**
   *
   * @param {string} alias
   * @param {string} tableName
   * @param {Object[]} toSelect
   * @private
   */
  static _addToSelectArrayByAlias(alias, tableName, toSelect) {
    let dataAttributes;

    switch (tableName) {
      case CommentsModelProvider.getTableName():
        dataAttributes = CommentsModelProvider.getCommentsFieldsForPreview();
        break;
      case PostsModelProvider.getTableName():
        dataAttributes = PostsModelProvider.getPostsFieldsForPreview();
        break;
      default:
        throw new Error(`Unsupported table name: ${tableName}`);
    }

    dataAttributes.forEach(attribute => {
      toSelect.push(`${alias}.${attribute} AS ${alias}__${attribute}`)
    });

    if (this._isOrgNeededForNotification(tableName)) {
      const dataAttributes = OrgModelProvider.getOrgFieldsForPreview();
      const extraAlias = `${alias}_org`;

      dataAttributes.forEach(attribute => {
        toSelect.push(`${extraAlias}.${attribute} AS ${extraAlias}__${attribute}`);
      });
    }

    if (this._isAuthorNeededForNotifications(tableName)) {
      const dataAttributes = UsersModelProvider.getUserFieldsForPreview();
      const authorAlias = `${alias}_author`;

      dataAttributes.forEach(attribute => {
        toSelect.push(`${authorAlias}.${attribute} AS ${authorAlias}__${attribute}`);
      });
    }
  }


  /**
   *
   * @param {string} tableName
   * @return {number}
   * @private
   */
  static _isAuthorNeededForNotifications(tableName) {
    const set = [
      CommentsModelProvider.getTableName(),
      PostsModelProvider.getTableName(),
    ];

    return ~set.indexOf(tableName);
  }

  /**
   *
   * @param {string} tableName
   * @return {number}
   * @private
   */
  static _isOrgNeededForNotification(tableName) {
    const set = [
      CommentsModelProvider.getTableName(),
      PostsModelProvider.getTableName(),
    ];

    return ~set.indexOf(tableName);
  }

  /**
   *
   * @param {string} tableName
   * @param {string} alias
   * @param {string} joinColumn
   * @return {string}
   * @private
   */
  static _addRequiredJoin(tableName, alias, joinColumn) {
    let joinSql = ` INNER JOIN ${tableName} AS ${alias} ON ${alias}.id = users_activity.${joinColumn}`;

    if (this._isAuthorNeededForNotifications(tableName)) {
      const authorAlias = `${alias}_author`;

      joinSql += ` INNER JOIN "Users" AS ${authorAlias} ON ${authorAlias}.id = ${alias}.user_id`;
    }

    if (this._isOrgNeededForNotification(tableName)) {
      const extraAlias = `${alias}_org`;

      // maybe there is no organization because entity is not from organization
      joinSql += ` LEFT JOIN organizations AS ${extraAlias} ON ${extraAlias}.id = ${alias}.organization_id`;
    }

    return joinSql;
  }
}

module.exports = UsersActivityToNotificationRepository;