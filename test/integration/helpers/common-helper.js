const UsersHelper       = require('./users-helper');
const OrgHelper         = require('./organizations-helper');
const CommentsHelper    = require('./comments-helper');
const PostsHelper    = require('./posts-helper');

const _ = require('lodash');

const { ContentTypeDictionary } = require('uos-app-transaction');


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
   * @param {Object[]} posts
   * @param {number} expectedLength
   * @param {Object} options
   * @return {Promise<void>}
   */
  static async checkPostsListFromApi(posts, expectedLength = null, options = {}) {
    if (expectedLength) {
      expect(posts.length).toBe(expectedLength);
    } else {
      expect(posts.length).toBeGreaterThan(0);
    }

    posts.forEach(post => {
      this.checkOnePostFromApi(post, options);
    });
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkOnePostFromApi(post, options) {
    // Activity:
    // User (author) data - with following data in order to follow/unfollow control
    // myself data - upvoting, join, editable, org_member
    // activity user posts

    // Comments if allowed - not allowed for direct post or for post list - special parameter
    // check is file uploaded - for creation

    expect(_.isEmpty(post)).toBeFalsy();

    PostsHelper.checkPostItselfCommonFields(post);
    UsersHelper.checkIncludedUserPreview(post);
    OrgHelper.checkOneOrgPreviewFieldsIfExists(post);

    if (options.myselfData) {
      expect(post.myselfData).toBeDefined();

      expect(post.myselfData.myselfVote).toBeDefined();
      expect(post.myselfData.join).toBeDefined();
      expect(post.myselfData.organization_member).toBeDefined();
    } else {
      expect(post.myselfData).not.toBeDefined();
    }
  }

  /**
   *
   * @deprecated - use checkOnePostFromApi + separate method to check db structure
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
}

module.exports = CommonHelper;