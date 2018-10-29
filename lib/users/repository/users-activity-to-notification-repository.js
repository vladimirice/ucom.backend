const models = require('../../../models');
const db = models.sequelize;

const UsersModelProvider    = require('../../users/service').ModelProvider;
const OrgModelProvider      = require('../../organizations/service').ModelProvider;
const CommentsModelProvider = require('../../comments/service').ModelProvider;
const PostsModelProvider    = require('../../posts/service').ModelProvider;

class UsersActivityToNotificationRepository {
  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserFollowsOrgNotification(activityId) {
    const dataSet         = this._getDataAttributeForUser('user_id_from', 'data');
    const targetEntitySet = this._getDataAttributeForOrg('entity_id_to', 'target_entity');

    return this._findForNotification(dataSet, targetEntitySet, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserFollowsOtherUser(activityId) {
    const dataSet         = this._getDataAttributeForUser('user_id_from', 'data');
    const targetEntitySet = this._getDataAttributeForUser('entity_id_to', 'target_entity');

    return this._findForNotification(dataSet, targetEntitySet, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserVotesPostOfOtherUser(activityId) {
    const dataSet         = this._getDataAttributeForUser('user_id_from', 'data');
    const targetEntitySet = this._getDataAttributeForPost('entity_id_to', 'target_entity');

    return this._findForNotification(dataSet, targetEntitySet, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserVotesCommentOfOtherUser(activityId) {
    const dataSet         = this._getDataAttributeForUser('user_id_from', 'data');
    const targetEntitySet = this._getDataAttributeForComment('entity_id_to', 'target_entity', false);

    return this._findForNotification(dataSet, targetEntitySet, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserVotesCommentOfOrg(activityId) {
    const dataSet         = this._getDataAttributeForUser('user_id_from', 'data');
    const targetEntitySet = this._getDataAttributeForComment('entity_id_to', 'target_entity', true);

    return this._findForNotification(dataSet, targetEntitySet, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserVotesPostOfOrg(activityId) {
    const dataSet         = this._getDataAttributeForUser('user_id_from', 'data');
    const targetEntitySet = this._getDataAttributeForPost('entity_id_to', 'target_entity');

    return this._findForNotification(dataSet, targetEntitySet, activityId);
  }

  /**
   * Will be refactored in future. It is differ from other methods because organization is one level with User
   * not inside
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
  static async findUserCreatesDirectPostForOtherUser(activityId) {
    const data          = this._getDataAttributeForPost('entity_id_to', 'data');
    const targetEntity  = this._getDataAttributeForUser('entity_id_on', 'target_entity');

    return this._findForNotification(data, targetEntity, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findUserCreatesDirectPostForOrg(activityId) {
    const data          = this._getDataAttributeForPost('entity_id_to', 'data');
    const targetEntity  = this._getDataAttributeForOrg('entity_id_on', 'target_entity');

    return this._findForNotification(data, targetEntity, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserCreatesCommentForComment(activityId) {
    const data    = this._getDataAttributeForComment('entity_id_to', 'data', false);
    const target  = this._getDataAttributeForComment('entity_id_on', 'target_entity', false);

    return this._findForNotification(data, target, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserCreatesCommentForPost(activityId) {
    const data    = this._getDataAttributeForComment('entity_id_to', 'data', false);
    const target  = this._getDataAttributeForPost('entity_id_on', 'target_entity');

    return this._findForNotification(data, target, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserCreatesCommentForOrgPost(activityId) {
    const data    = this._getDataAttributeForComment('entity_id_to', 'data', false);
    const target  = this._getDataAttributeForPost('entity_id_on', 'target_entity');

    return this._findForNotification(data, target, activityId);
  }

  /**
   *
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   */
  static async findForUserCreatesCommentForOrgComment(activityId) {
    const data    = this._getDataAttributeForComment('entity_id_to', 'data', false);
    const target  = this._getDataAttributeForComment('entity_id_on', 'target_entity', true);

    return this._findForNotification(data, target, activityId);
  }

  /**
   *
   * @param {string} activityColumn
   * @param {string} dataAlias
   * @return {*[]}
   * @private
   */
  static _getDataAttributeForPost(activityColumn, dataAlias) {
    const attributes = {
      table_name:               PostsModelProvider.getTableName(),
      entity_name:              PostsModelProvider.getEntityName(),
      schema_key:               PostsModelProvider.getPostsSingularName(),
      related_activity_column:  activityColumn,
      data_alias:               dataAlias,
    };

    const schema = [
      {
        schemaKey:    attributes.schema_key,
        dbKey:        attributes.data_alias,
        dbAuthorKey:  attributes.data_alias + '_author',
        dbOrgKey:     attributes.data_alias + '_org',
      },
    ];

    return [
      attributes,
      schema
    ]
  }

  /**
   *
   * @param {string} activityColumn
   * @param {string} dataAlias
   * @param {boolean} isOfOrg
   * @return {*[]}
   * @private
   */
  static _getDataAttributeForComment(activityColumn, dataAlias, isOfOrg) {
    const attributes = {
      table_name:               CommentsModelProvider.getCommentsTableName(),
      entity_name:              CommentsModelProvider.getEntityName(),
      schema_key:               CommentsModelProvider.getCommentsSingularName(),
      related_activity_column:  activityColumn,
      data_alias:               dataAlias,
    };

    const schema = [
      {
        schemaKey:    attributes.schema_key,
        dbKey:        attributes.data_alias,
        dbAuthorKey:  attributes.data_alias + '_author',
        dbPostKey:    attributes.data_alias + '_post',
      },
    ];

    if (isOfOrg) {
      schema[0].dbOrgKey = attributes.data_alias + '_org';
    }

    return [
      attributes,
      schema
    ];
  }


  /**
   *
   * @param {string} activityColumn
   * @param {string} dataAlias
   * @return {*[]}
   * @private
   */
  static _getDataAttributeForUser(activityColumn, dataAlias) {
    const attributes = {
      table_name:               UsersModelProvider.getUsersTableName(),
      entity_name:              UsersModelProvider.getUsersEntityName(),
      schema_key:               UsersModelProvider.getUsersSingularName(),
      related_activity_column:  activityColumn,
      data_alias:               dataAlias,
    };

    const schema = [
      {
        schemaKey:    attributes.schema_key,
        dbKey:        attributes.data_alias,
      }
    ];

    return [
      attributes,
      schema
    ];
  }

  /**
   *
   * @param {string} activityColumn
   * @param {string} dataAlias
   * @return {*[]}
   * @private
   */
  static _getDataAttributeForOrg(activityColumn, dataAlias) {
    const attributes = {
      table_name:               OrgModelProvider.getTableName(),
      entity_name:              OrgModelProvider.getEntityName(),
      schema_key:               OrgModelProvider.getOrganizationSingularName(),
      related_activity_column:  activityColumn,
      data_alias:               dataAlias,
    };

    const schema = [
      {
        schemaKey:    attributes.schema_key,
        dbKey:        attributes.data_alias,
        dbAuthorKey:  attributes.data_alias + '_author',
      }
    ];

    return [
      attributes,
      schema
    ];
  }

  /**
   *
   * @param {Object} dataSet
   * @param {Object} targetEntitySet
   * @param {number} activityId
   * @return {Promise<{data: {}, target_entity: {}}>}
   * @private
   */
  static async _findForNotification(dataSet, targetEntitySet, activityId) {
    const [ dataAttributes, dataSchema ]      = dataSet;
    const [ targetAttributes, targetSchema ]  = targetEntitySet;

    const schema = {
      data:          dataSchema,
      target_entity: targetSchema
    };

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

      if (set.dbPostKey) {
        res.data[set.schemaKey].post = {};
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

      if (set.dbPostKey) {
        res.target_entity[set.schemaKey].post = {};
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

        if (set.dbPostKey && field.includes(set.dbPostKey + '__')) {
          const fieldName = field.replace(set.dbPostKey + '__', '');

          res.data[set.schemaKey].post[fieldName] = dbData[field];
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

        if (set.dbPostKey && field.includes(set.dbPostKey + '__')) {
          const fieldName = field.replace(set.dbPostKey + '__', '');

          res.target_entity[set.schemaKey].post[fieldName] = dbData[field];
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
      case UsersModelProvider.getTableName():
        dataAttributes = UsersModelProvider.getUserFieldsForPreview();
        break;
      case OrgModelProvider.getTableName():
        dataAttributes = OrgModelProvider.getOrgFieldsForPreview();
        break;
      default:
        throw new Error(`Unsupported table name: ${tableName}`);
    }

    dataAttributes.forEach(attribute => {
      toSelect.push(`${alias}.${attribute} AS ${alias}__${attribute}`)
    });

    if (this._isPostNeededForNotification(tableName)) {
      const dataAttributes = PostsModelProvider.getPostsFieldsForPreview();
      const extraAlias = `${alias}_post`;

      dataAttributes.forEach(attribute => {
        toSelect.push(`${extraAlias}.${attribute} AS ${extraAlias}__${attribute}`);
      });
    }

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
      OrgModelProvider.getTableName(),
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
   * @return {number}
   * @private
   */
  static _isPostNeededForNotification(tableName) {
    const set = [
      CommentsModelProvider.getTableName(),
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
    let joinSql = ` INNER JOIN "${tableName}" AS ${alias} ON ${alias}.id = users_activity.${joinColumn}`;

    if (this._isAuthorNeededForNotifications(tableName)) {
      const authorAlias = `${alias}_author`;

      joinSql += ` INNER JOIN "Users" AS ${authorAlias} ON ${authorAlias}.id = ${alias}.user_id`;
    }

    if (this._isOrgNeededForNotification(tableName)) {
      const extraAlias = `${alias}_org`;

      // maybe there is no organization because entity is not from organization
      joinSql += ` LEFT JOIN organizations AS ${extraAlias} ON ${extraAlias}.id = ${alias}.organization_id`;
    }

    if (this._isPostNeededForNotification(tableName)) {
      const extraAlias = `${alias}_post`;

      // maybe there is no organization because entity is not from organization
      joinSql += ` LEFT JOIN posts AS ${extraAlias} ON ${extraAlias}.id = ${alias}.commentable_id`;
    }

    return joinSql;
  }
}

module.exports = UsersActivityToNotificationRepository;