const _ = require('lodash');

const PostsModelProvider  = require('../../posts/service').ModelProvider;
const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const sequelizeIncludes = require('./sequelize-includes');

const models = require('../../../models');
const Op = models.sequelize.Op;
const db = models.sequelize;


/**
 * repository name is wrong. This repo used to fetch also tags wall feed data
 */
class UsersFeedRepository {
  /**
   *
   * @param {string} tagTitle
   * @param {Object} givenParams
   * @returns {Promise<Object[]>}
   */
  static async findAllPostsForWallFeedByTag(tagTitle, givenParams) {
    givenParams.where = this._whereEntityTagsContain([tagTitle]);

    return this._findAllForWallFeed(givenParams);
  }

  /**
   *
   * @param {string} tagTitle
   * @returns {Promise<number>}
   */
  static async countAllPostsForWallFeedByTag(tagTitle) {
    return await PostsModelProvider.getModel().count({
      where: this._whereEntityTagsContain([tagTitle]),
    });
  }

  /**
   *
   * @param {string[]} tagTitles
   * @returns {{entity_tags: {}}}
   * @private
   */
  static _whereEntityTagsContain(tagTitles) {
    return {
      entity_tags: {
        [Op.contains]: db.cast(tagTitles, 'text[]'),
      },
    };
  }

  /**
   *
   * @param {number} userId
   * @param {Object} givenParams
   * @return {Promise<any[]>}
   */
  static async findAllForUserWallFeed(userId, givenParams = {}) {
    const params = _.defaults(givenParams, this._getDefaultListParams());

    params.attributes = PostsModelProvider.getPostsFieldsForPreview();

    params.where = {
      entity_name_for:  UsersModelProvider.getEntityName(),
      entity_id_for:    userId
    };

    params.include = sequelizeIncludes.getIncludeForPostList();

    const models = await PostsModelProvider.getModel().findAll(params);

    return models.map(model => {
      return model.toJSON();
    });
  }

  /**
   *
   * @param {number} userId
   * @param {number[]} usersIds
   * @param {number[]} orgIds
   * @param {Object} givenParams
   * @return {Promise<any[]>}
   */
  static async findAllForUserNewsFeed(userId, usersIds, orgIds, givenParams) {
    const params = _.defaults(givenParams, this._getDefaultListParams());

    params.attributes = PostsModelProvider.getPostsFieldsForPreview();
    params.include = sequelizeIncludes.getIncludeForPostList();

    params.where = {
      [Op.or]: [
        {
          entity_id_for:   _.concat(usersIds, userId),
          entity_name_for: UsersModelProvider.getEntityName()
        },
        {
          entity_id_for:    orgIds,
          entity_name_for:  OrgModelProvider.getEntityName()
        },
      ]
    };

    const models = await PostsModelProvider.getModel().findAll(params);

    return models.map(model => {
      return model.toJSON();
    });
  }

  /**
   *
   * @param {number} userId
   * @param {number[]} usersIds
   * @param {number[]} orgIds
   * @return {Promise<any[]>}
   */
  static async countAllForUserNewsFeed(userId, usersIds, orgIds) {
    const where = {
      [Op.or]: [
        {
          entity_id_for:   _.concat(usersIds, userId),
          entity_name_for: UsersModelProvider.getEntityName()
        },
        {
          entity_id_for:    orgIds,
          entity_name_for:  OrgModelProvider.getEntityName()
        },
      ]
    };

    return await PostsModelProvider.getModel().count({
      where,
    });
  }

  /**
   *
   * @param {number} entityId
   * @return {Promise<*>}
   */
  static async countAllForOrgWallFeed(entityId) {
    const entityNameFor = OrgModelProvider.getEntityName();

    return await this._countAllForWallFeed(entityId, entityNameFor);
  }

  /**
   *
   * @param {number} wallOwnerId
   * @return {Promise<*>}
   */
  static async countAllForUserWallFeed(wallOwnerId) {
    const entityNameFor = UsersModelProvider.getEntityName();

    return await this._countAllForWallFeed(wallOwnerId, entityNameFor);
  }

  /**
   *
   * @param {number} entityId
   * @param {Object} givenParams
   * @return {Promise<any[]>}
   */
  static async findAllForOrgWallFeed(entityId, givenParams = {}) {
    const params = _.defaults(givenParams, this._getDefaultListParams());

    params.attributes = PostsModelProvider.getPostsFieldsForPreview();

    params.where = {
      entity_name_for:  OrgModelProvider.getEntityName(),
      entity_id_for:    entityId
    };

    params.include = sequelizeIncludes.getIncludeForPostList();

    const models = await PostsModelProvider.getModel().findAll(params);

    return models.map(model => {
      return model.toJSON();
    });
  }

  /**
   *
   * @param {Object} givenParams
   * @returns {Promise<Object[]>}
   * @private
   */
  static async _findAllForWallFeed(givenParams) {
    const params = _.defaults(givenParams, this._getDefaultListParams());

    params.attributes = PostsModelProvider.getPostsFieldsForPreview();
    params.include = sequelizeIncludes.getIncludeForPostList();

    const models = await PostsModelProvider.getModel().findAll(params);

    return models.map(model => {
      return model.toJSON();
    });
  }

  /**
   *
   * @param {number} entityId
   * @param {string} entityNameFor
   * @return {Promise<*>}
   * @private
   */
  static async _countAllForWallFeed(entityId, entityNameFor) {
    const tableName = PostsModelProvider.getTableName();

    const sql = `
      SELECT COUNT(1) 
      FROM 
        ${tableName} 
      WHERE 
        entity_name_for   = '${entityNameFor}' 
        AND entity_id_for = ${+entityId}
      `;

    const res = await db.query(sql, { type: db.QueryTypes.SELECT });

    return +res[0].count;
  }

  /**
   *
   * @return {Object}
   * @private
   */
  static _getDefaultListParams() {
    return {
      offset: 0,
      limit: 10,
      where: {},
      order: this._getDefaultOrderBy()
    }
  }

  /**
   *
   * @return {string[][]}
   * @private
   */
  static _getDefaultOrderBy() {
    return [
      ['id', 'DESC']
    ];
  }
}

module.exports= UsersFeedRepository;