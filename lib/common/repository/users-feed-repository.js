const _ = require('lodash');

const PostsModelProvider  = require('../../posts/service').ModelProvider;
const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const models = require('../../../models');
const Op = models.sequelize.Op;

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
   * @return {Promise<any[]>}
   */
  static async findAllForOrgWallFeed(entityId) {
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
      order
    });

    return models.map(model => {
      return model.toJSON();
    });
  }
}

module.exports= UsersFeedRepository;