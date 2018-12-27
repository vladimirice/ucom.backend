const UsersHelper         = require('./users-helper');
const OrgHelper           = require('./organizations-helper');
const CommentsHelper      = require('./comments-helper');
const PostsHelper         = require('./posts-helper');
const NotificationsHelper = require('./notifications-helper');
const EventIdDictionary   = require('../../../lib/entities/dictionary').EventId;

const _ = require('lodash');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');


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

  // noinspection JSUnusedGlobalSymbols
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
    UsersHelper.checkIncludedUserPreview(comment);

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
  static checkNotificationsList(models, expectedLength, options = {}) {
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
  static checkOneNotificationsFromList(model, options = {}) {
    expect(_.isEmpty(model)).toBeFalsy();
    NotificationsHelper.checkNotificationItselfCommonFields(model, options);
    // UsersHelper.checkIncludedUserPreview(model);

    expect(model.data).toBeDefined();
    expect(model.data).not.toBeNull();

    expect(model.target_entity).toBeDefined();
    expect(model.target_entity).not.toBeNull();

    if (options.myselfData) {
      expect(model.myselfData).toBeDefined();
      expect(model.myselfData.unread_messages_count).toBeDefined();
    }

    switch (model.event_id) {
      case EventIdDictionary.getOrgUsersTeamInvitation():
        this.checkOrgUsersTeamInvitationNotification(model);
        break;
      case EventIdDictionary.getUserFollowsYou():
        this.checkUserFollowsYouNotification(model);
        break;
      case EventIdDictionary.getUserFollowsOrg():
        this.checkUserFollowsOrgNotification(model);
        break;
      case EventIdDictionary.getUserCommentsPost():
        this.checkUserCommentsPostNotification(model, options);
        break;
      case EventIdDictionary.getUserCommentsComment():
        this.checkUserCommentsOtherCommentNotification(model, options);
        break;
      case EventIdDictionary.getUserCommentsOrgPost():
        this.checkUserCommentsOrgPostNotification(model, options);
        break;
      case EventIdDictionary.getUserCommentsOrgComment():
        this.checkUserCommentsOrgCommentNotification(model, options);
        break;
      case EventIdDictionary.getUserCreatesDirectPostForOtherUser():
        this.checkUserCreatesDirectPostForOtherUser(model, options);
        break;
      case EventIdDictionary.getUserCreatesDirectPostForOrg():
        this.checkUserCreatesDirectPostForOrg(model, options);
        break;
      default:
        throw new Error(`Dunno how to check model with eventID ${model.event_id}`);
    }
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @param {number} expectedDataPostId
   * @param {number} expectedTargetEntityPostId
   */
  static checkUserRepostsOtherUserPost(model, options, expectedDataPostId, expectedTargetEntityPostId) {
    expect(model.event_id).toBe(EventIdDictionary.getUserRepostsOtherUserPost());

    this.checkOneRepostForNotification(model.data.post, false);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);

    expect(model.data.post.id).toBe(expectedDataPostId);
    expect(model.target_entity.post.id).toBe(expectedTargetEntityPostId);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @param {number} expectedPostId
   * @param {number} expectedUserIdFrom
   * @param expectedUserIdTo
   */
  static checkUserMentionsYouInsidePost(model, options, expectedPostId, expectedUserIdFrom, expectedUserIdTo) {
    expect(model.event_id).toBe(EventIdDictionary.getUserHasMentionedYouInPost());

    expect(model.data.post.id).toBe(expectedPostId);
    expect(model.data.post.User.id, expectedUserIdFrom);
    PostsHelper.checkPostItselfCommonFields(model.data.post, options);
    UsersHelper.checkIncludedUserPreview(model.data.post);

    expect(model.target_entity.User.id).toBe(expectedUserIdTo);
    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @param {number} expectedDataPostId
   * @param {number} expectedTargetEntityPostId
   */
  static checkUserRepostsOrgPost(model, options, expectedDataPostId, expectedTargetEntityPostId) {
    expect(model.event_id).toBe(EventIdDictionary.getUserRepostsOrgPost());

    this.checkOneRepostForNotification(model.data.post, false);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);
    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);

    expect(model.data.post.id).toBe(expectedDataPostId);
    expect(model.target_entity.post.id).toBe(expectedTargetEntityPostId);
  }

  /**
   * @param {Object} model
   */
  static checkOrgUsersTeamInvitationNotification(model) {
    expect(model.event_id).toBe(EventIdDictionary.getOrgUsersTeamInvitation());

    OrgHelper.checkOneOrganizationPreviewFields(model.data.organization);

    UsersHelper.checkIncludedUserPreview(model.data);
    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   */
  static checkUserFollowsYouNotification(model) {
    expect(model.event_id).toBe(EventIdDictionary.getUserFollowsYou());

    UsersHelper.checkIncludedUserPreview(model.data);
    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   */
  static checkUserFollowsOrgNotification(model) {
    expect(model.event_id).toBe(EventIdDictionary.getUserFollowsOrg());

    UsersHelper.checkIncludedUserPreview(model.data);
    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserUpvotesPostOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(EventIdDictionary.getUserUpvotesPostOfOtherUser());

    UsersHelper.checkIncludedUserPreview(model.data);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);
  }

  static checkUserDownvotesPostOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(EventIdDictionary.getUserDownvotesPostOfOtherUser());

    UsersHelper.checkIncludedUserPreview(model.data);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);
  }

  static checkUserUpvotesCommentOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(EventIdDictionary.getUserUpvotesCommentOfOtherUser());

    UsersHelper.checkIncludedUserPreview(model.data);

    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, options);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);
  }

  static checkUserDownvotesCommentOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(EventIdDictionary.getUserDownvotesCommentOfOtherUser());

    UsersHelper.checkIncludedUserPreview(model.data);

    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, options);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserUpvotesPostOfOrg(model, options = {}) {
    expect(model.event_id).toBe(EventIdDictionary.getUserUpvotesPostOfOrg());

    UsersHelper.checkIncludedUserPreview(model.data);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);

    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization)
  }

  static checkUserDownvotesPostOfOrg(model, options = {}) {
    expect(model.event_id).toBe(EventIdDictionary.getUserDownvotesPostOfOrg());

    UsersHelper.checkIncludedUserPreview(model.data);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);

    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization)
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserUpvotesCommentOfOrg(model, options = {}) {
    expect(model.event_id).toBe(EventIdDictionary.getUserUpvotesCommentOfOrg());

    UsersHelper.checkIncludedUserPreview(model.data);
    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg'
    });
    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserDownvotesCommentOfOrg(model, options = {}) {
    expect(model.event_id).toBe(EventIdDictionary.getUserDownvotesCommentOfOrg());

    UsersHelper.checkIncludedUserPreview(model.data);
    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg'
    });
    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @private
   */
  static checkUserCommentsPostNotification(model, options) {
    CommentsHelper.checkOneCommentPreviewFields(model.data.comment, options);
    UsersHelper.checkIncludedUserPreview(model.data.comment);
    PostsHelper.checkPostItselfCommonFields(model.data.comment.post, options);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);

    UsersHelper.checkIncludedUserPreview(model.target_entity.post);
  }
  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @private
   */
  static checkUserCommentsOrgPostNotification(model, options) {
    CommentsHelper.checkOneCommentPreviewFields(model.data.comment, options);
    UsersHelper.checkIncludedUserPreview(model.data.comment);

    PostsHelper.checkPostItselfCommonFields(model.data.comment.post, options);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);

    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @private
   */
  static checkUserCommentsOrgCommentNotification(model, options) {
    expect(model.event_id).toBe(EventIdDictionary.getUserCommentsOrgComment());

    CommentsHelper.checkOneCommentPreviewFields(model.data.comment, {
      postProcessing: 'notification'
    });

    UsersHelper.checkIncludedUserPreview(model.data.comment);

    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg'
    });

    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);
    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
  }

  static checkUserCreatesDirectPostForOtherUser(model, options) {
    PostsHelper.checkPostItselfCommonFields(model.data.post, options);
    UsersHelper.checkIncludedUserPreview(model.data.post);

    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  static checkUserCreatesDirectPostForOrg(model, options) {
    PostsHelper.checkPostItselfCommonFields(model.data.post, options);
    UsersHelper.checkIncludedUserPreview(model.data.post);

    OrgHelper.checkOneOrganizationPreviewFields(model.target_entity.organization);
    UsersHelper.checkIncludedUserPreview(model.target_entity.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @private
   */
  static checkUserCommentsOtherCommentNotification(model, options) {
    CommentsHelper.checkOneCommentPreviewFields(model.data.comment, options);
    UsersHelper.checkIncludedUserPreview(model.data.comment);

    PostsHelper.checkPostItselfCommonFields(model.data.comment.post, options);

    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
  }

  /**
   *
   * @param {Object[]} posts
   * @param {number|null} expectedLength
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
   * @param {Object} options
   * @param {boolean} isOrg
   */
  static checkOneRepostForList(post, options, isOrg) {
    expect(_.isEmpty(post)).toBeFalsy();
    expect(_.isEmpty(post.post)).toBeFalsy();

    PostsHelper.checkPostItselfCommonFields(post.post, options);

    UsersHelper.checkIncludedUserPreview(post);
    UsersHelper.checkIncludedUserPreview(post.post);

    if (isOrg) {
      OrgHelper.checkOneOrganizationPreviewFields(post.post.organization);
    } else {
      expect(post.post.organization).toBeFalsy();
    }

    this._checkMyselfData(post, options);
  }

  /**
   *
   * @param {Object} post
   * @param {boolean} isOrg
   */
  static checkOneRepostForNotification(post, isOrg) {
    expect(_.isEmpty(post)).toBeFalsy();

    expect(post.user_id).toBeDefined();
    expect(post.id).toBeDefined();

    expect(post.post_type_id).toBe(ContentTypeDictionary.getTypeRepost());
    UsersHelper.checkIncludedUserPreview(post);

    if (isOrg) {
      OrgHelper.checkOneOrganizationPreviewFields(post.post.organization);
    } else {
      expect(post.organization).toBeFalsy();
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