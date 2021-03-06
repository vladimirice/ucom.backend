const postsModelProvider  = require('../../posts/service/posts-model-provider');
const usersModelProvider  = require('../../users/users-model-provider');
const orgModelProvider    = require('../../organizations/service/organizations-model-provider');

const models = require('../../../models');

class SequelizeIncludes {
  /**
   *
   * @returns {string[]}
   */
  static getIncludeForPostList(): string[] {
    return [
      orgModelProvider.getIncludeForPreview(),
      usersModelProvider.getIncludeAuthorForPreview(),

      postsModelProvider.getPostsStatsInclude(),
      postsModelProvider.getPostOfferItselfInclude(),
      postsModelProvider.getParentPostInclude(),
    ];
  }

  static getIncludeForPostCommentsObject(): any {
    return {
      attributes: models.comments.getFieldsForPreview(),
      model: models.comments,
      as: 'comments',
      required: false,
      include: [
        usersModelProvider.getIncludeAuthorForPreview(),
        orgModelProvider.getIncludeForPreview(),
      ],
    };
  }
}

export = SequelizeIncludes;
