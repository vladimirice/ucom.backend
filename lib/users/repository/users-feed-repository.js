const PostsModelProvider  = require('../../posts/service').ModelProvider;
const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const _ = require('lodash');

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