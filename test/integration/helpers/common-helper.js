const UsersHelper       = require('./users-helper');
const OrgHelper         = require('./organizations-helper');
const CommentsHelper    = require('./comments-helper');
const PostsHelper    = require('./posts-helper');
const ResponseHelper    = require('./response-helper');

const _ = require('lodash');


const PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');

const { TransactionFactory, ContentTypeDictionary, InteractionTypeDictionary } = require('uos-app-transaction');


require('jest-expect-message');

class CommonHelper {
  /**
   *
   * @param {Object[]} comments
   */
  static checkManyCommentsPreviewWithRelations(comments) {
    comments.forEach(comment => {
      this.checkOneCommentPreviewWithRelations(comment);
    });
  }

  /**
   *
   * @param {Object} comment
   */
  static checkOneCommentPreviewWithRelations(comment) {
    CommentsHelper.checkOneCommentPreviewFields(comment);
    UsersHelper.checkUserPreview(comment.User);

    if (comment.organization_id) {
      OrgHelper.checkOneOrganizationPreviewFields(comment.organization);
    }
  }

  /**
   *
   * @param {Object} post
   * @param {Object} expectedValues
   * @param {Object} author
   */
  static async checkDirectPost(post, expectedValues = {}, author) {
    PostsHelper.checkDirectPostItself(post);
    UsersHelper.checkIncludedUserPreview(post);
    OrgHelper.checkOneOrgPreviewFieldsIfExists(post);

    await PostsHelper.expectPostDbValues(post, {
      post_type_id: ContentTypeDictionary.getTypeDirectPost(),
      user_id: author.id,
      ...expectedValues
    });

    // entity_stats - comments count // TODO
    // myself data - upvoting, editable, org member // TODO

    // check that related models are created
  }

  static checkOnePostWithRelations(post) {
    // must have all post data
    // User (author) data - with following data in order to follow/unfollow control
    // Organization data if is from org

    // post_stats - comments count
    // normalized fields - as example, current_rate
    // myself data - upvoting, join, editable, org_member

    // Comments if allowed - not allowed for direct post

    // post_users_team
    // activity user posts
    // check response signature
    // check is file uploaded
  }
}

module.exports = CommonHelper;