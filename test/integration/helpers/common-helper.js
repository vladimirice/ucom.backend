const UsersHelper         = require('./users-helper');
const OrgHelper           = require('./organizations-helper');
const CommentsHelper      = require('./comments-helper');
const PostsHelper         = require('./posts-helper');
const NotificationsHelper = require('./notifications-helper');
const EventIdDictionary   = require('../../../lib/entities/dictionary').EventId;

const _ = require('lodash');

const { ContentTypeDictionary } = require('uos-app-transaction');


require('jest-expect-message');

class CommonHelper {
  /**
   *
   * @param {Object[]} comments
   * @param {Object} options
   */
  static checkManyCommentsPreviewWithRelations(comments, options = {}) {
    comments.forEach(comment => {
      this.checkOneCommentPreviewWithRelations(comment, options);
    });
  }

  /**
   *
   * @return {{myselfData: boolean, postProcessing: string}}
   */
  static getOptionsForListAndMyself() {
    return {
      myselfData:     true,
      postProcessing: 'list'
    }
  }

  /**
   *
   * @return {{myselfData: boolean, postProcessing: string}}
   */
  static getOptionsForListAndGuest() {
    return {
      myselfData:     false,
      postProcessing: 'list'
    }
  }

  /**
   *
   * @return {{myselfData: boolean, postProcessing: string}}
   */
  static getOptionsForFullAndGuest() {
    return {
      myselfData:     false,
      postProcessing: 'full'
    }
  }

  /**
   *
   * @param {Object} comment
   * @param {Object} options
   */
  static checkOneCommentPreviewWithRelations(comment, options) {
    CommentsHelper.checkOneCommentPreviewFields(comment, options);
    UsersHelper.checkUserPreview(comment.User);

    if (comment.organization_id) {
      OrgHelper.checkOneOrganizationPreviewFields(comment.organization);
    }
  }

  /**
   *
   * @param {Object[]} models
   * @param {number} expectedLength
   * @param {Object} options
   */
  static checkNotificationsList(models, expectedLength, options) {
    expect(models).toBeDefined();
    expect(models.length).toBe(expectedLength);

    models.forEach(post => {
      this.checkOneNotificationsFromList(post, options);
    });
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkOneNotificationsFromList(model, options) {
    expect(_.isEmpty(model)).toBeFalsy();
    NotificationsHelper.checkNotificationItselfCommonFields(model, options);
    // UsersHelper.checkIncludedUserPreview(model);

    expect(model.data).toBeDefined();
    expect(model.data).not.toBeNull();

    expect(model.target_entity).toBeDefined();
    expect(model.target_entity).not.toBeNull();

    switch (model.event_id) {
      case EventIdDictionary.getOrgUsersTeamInvitation():
        this._checkOrgUsersTeamInvitationNotification(model);
        break;
      default:
        throw new Error(`Dunno how to check model with eventID ${model.event_id}`);
    }

    // TODO - for board invitation prompt only
    OrgHelper.checkOneOrganizationPreviewFields(model.data.organization);
    // this._checkMyselfData(post, options);
  }


  static _checkOrgUsersTeamInvitationNotification(model) {
    OrgHelper.checkOneOrganizationPreviewFields(model.data.organization);
    UsersHelper.checkIncludedUserPreview(model.target_entity);

    // Target entity must be User = recipient
  }

  /**
   *
   * @param {Object[]} posts
   * @param {number} expectedLength
   * @param {Object} options
   */
  static checkPostsListFromApi(posts, expectedLength = null, options = {}) {
    if (expectedLength) {
      expect(posts.length).toBe(expectedLength);
    } else {
      expect(posts.length).toBeGreaterThan(0);
    }

    posts.forEach(post => {
      this.checkOneListPostFromApi(post, options);
    });
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkOneListPostFromApi(post, options) {
    // Activity:
    // User (author) data - with following data in order to follow/unfollow control
    // myself data - upvoting, join, editable, org_member
    // activity user posts
    // check is file uploaded - for creation

    expect(_.isEmpty(post)).toBeFalsy();

    PostsHelper.checkPostItselfCommonFields(post, options);
    UsersHelper.checkIncludedUserPreview(post);
    OrgHelper.checkOneOrgPreviewFieldsIfExists(post);

    this._checkMyselfData(post, options);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkOnePostForPage(post, options) {
    expect(_.isEmpty(post)).toBeFalsy();

    PostsHelper.checkPostItselfCommonFields(post, options);
    UsersHelper.checkIncludedUserForEntityPage(post, options);
    OrgHelper.checkOneOrgPreviewFieldsIfExists(post);

    this._checkMyselfData(post, options);

    if (options.postProcessing === 'full') {
      expect(post.comments).toBeDefined();

      this.checkManyCommentsPreviewWithRelations(post.comments, options);
    }
  }

  /**
   *
   * @param {Object} post
   * @param {Object} expectedValues
   * @param {Object} author
   */
  static async checkDirectPostInDb(post, expectedValues = {}, author) {
    await PostsHelper.expectPostDbValues(post, {
      post_type_id: ContentTypeDictionary.getTypeDirectPost(),
      user_id: author.id,
      ...expectedValues
    });

    // entity_stats - comments count // TODO
    // myself data - upvoting, editable, org member // TODO

    // check that related models are created
  }

  static _checkMyselfData(post, options) {
    if (options.myselfData) {
      expect(post.myselfData).toBeDefined();

      expect(post.myselfData.myselfVote).toBeDefined();
      expect(post.myselfData.join).toBeDefined();
      expect(post.myselfData.organization_member).toBeDefined();
    } else {
      expect(post.myselfData).not.toBeDefined();
    }
  }
}

module.exports = CommonHelper;