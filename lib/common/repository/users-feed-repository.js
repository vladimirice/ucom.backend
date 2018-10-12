const _ = require('lodash');

const PostsModelProvider  = require('../../posts/service').ModelProvider;
const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const models = require('../../../models');
const Op = models.sequelize.Op;
const db = models.sequelize;

class UsersFeedRepository {

  /**
   *
   * @param {number} userId
   * @return {Promise<any[]>}
   */
  static async findAllForUserWallFeed(userId) {
    const where = {
      entity_name_for:  UsersModelProvider.getEntityName(),
      entity_id_for:    userId
    };

    const include = [
      OrgModelProvider.getIncludeForPreview(),
      UsersModelProvider.getIncludeAuthorForPreview(),
      PostsModelProvider.getPostsStatsInclude(),
      PostsModelProvider.getPostOfferItselfInclude()
    ];

    const order = [
      ['id', 'DESC']
    ];

    const models = await PostsModelProvider.getModel().findAll({
      where,
      include,
      order
    });

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
  static async findAllForUserNewsFeed(userId, usersIds, orgIds) {
    // const where = {
    //   entity_name_for:  UsersModelProvider.getEntityName(),
    //   entity_id_for:    userId
    // };

    const include = [
      OrgModelProvider.getIncludeForPreview(),
      UsersModelProvider.getIncludeAuthorForPreview(),
      PostsModelProvider.getPostsStatsInclude(),
      PostsModelProvider.getPostOfferItselfInclude()
    ];

    /*
beforehand
users_ids.push(myself.id) -> for user news feed

SELECT * FROM posts
WHERE
  (entity_id_for IN (users_ids) AND entity_id_for = 'users')
  OR
  (entity_id_for IN (org_ids) AND entity_id_for = 'orgs')
  OR
 */

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

    const order = [
      ['id', 'DESC']
    ];

    const models = await PostsModelProvider.getModel().findAll({
      where,
      include,
      order
    });

    return models.map(model => {
      return model.toJSON();
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
   * @param {number} entityId
   * @param {Object} params
   * @return {Promise<any[]>}
   */
  static async findAllForOrgWallFeed(entityId, params = null) {
    const where = {
      entity_name_for:  OrgModelProvider.getEntityName(),
      entity_id_for:    entityId
    };

    const include = [
      OrgModelProvider.getIncludeForPreview(),
      UsersModelProvider.getIncludeAuthorForPreview(),
      PostsModelProvider.getPostsStatsInclude(),
      PostsModelProvider.getPostOfferItselfInclude()
    ];

    const order = [
      ['id', 'DESC']
    ];

    const models = await PostsModelProvider.getModel().findAll({
      where,
      include,
      order,
      offset: params  ? params.offset : null,
      limit:  params  ? params.limit : null
    });

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
}

module.exports= UsersFeedRepository;