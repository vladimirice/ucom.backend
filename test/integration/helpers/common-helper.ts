const usersHelper         = require('./users-helper');
const orgHelper           = require('./organizations-helper');
const commentsHelper      = require('./comments-helper');
const postsHelper         = require('./posts-helper');
const notificationsHelper = require('./notifications-helper');
const eventIdDictionary   = require('../../../lib/entities/dictionary').EventId;

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
    comments.forEach((comment) => {
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
      postProcessing: 'list',
    };
  }

  /**
   *
   * @return {{myselfData: boolean, postProcessing: string}}
   */
  static getOptionsForListAndGuest() {
    return {
      myselfData:     false,
      postProcessing: 'list',
    };
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {{myselfData: boolean, postProcessing: string}}
   */
  static getOptionsForFullAndGuest() {
    return {
      myselfData:     false,
      postProcessing: 'full',
    };
  }

  /**
   *
   * @param {Object} comment
   * @param {Object} options
   */
  static checkOneCommentPreviewWithRelations(comment, options) {
    commentsHelper.checkOneCommentPreviewFields(comment, options);
    usersHelper.checkIncludedUserPreview(comment);

    this.checkCreatedAtUpdatedAtFormat(comment);

    if (comment.organization_id) {
      orgHelper.checkOneOrganizationPreviewFields(comment.organization);
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

    models.forEach((post) => {
      this.checkOneNotificationsFromList(post, options);
    });
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkOneNotificationsFromList(model, options: any = {}) {
    expect(_.isEmpty(model)).toBeFalsy();
    notificationsHelper.checkNotificationItselfCommonFields(model);
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
      case eventIdDictionary.getOrgUsersTeamInvitation():
        this.checkOrgUsersTeamInvitationNotification(model);
        break;
      case eventIdDictionary.getUserFollowsYou():
        this.checkUserFollowsYouNotification(model);
        break;
      case eventIdDictionary.getUserFollowsOrg():
        this.checkUserFollowsOrgNotification(model);
        break;
      case eventIdDictionary.getUserCommentsPost():
        this.checkUserCommentsPostNotification(model, options);
        break;
      case eventIdDictionary.getUserCommentsComment():
        this.checkUserCommentsOtherCommentNotification(model, options);
        break;
      case eventIdDictionary.getUserCommentsOrgPost():
        this.checkUserCommentsOrgPostNotification(model, options);
        break;
      case eventIdDictionary.getUserCommentsOrgComment():
        this.checkUserCommentsOrgCommentNotification(model);
        break;
      case eventIdDictionary.getUserCreatesDirectPostForOtherUser():
        this.checkUserCreatesDirectPostForOtherUser(model, options);
        break;
      case eventIdDictionary.getUserCreatesDirectPostForOrg():
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
  static checkUserRepostsOtherUserPost(
    model,
    options,
    expectedDataPostId,
    expectedTargetEntityPostId,
  ): void {
    expect(model.event_id).toBe(eventIdDictionary.getUserRepostsOtherUserPost());

    this.checkOneRepostForNotification(model.data.post, false);

    postsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.post);

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
  static checkUserMentionsYouInsidePost(
    model,
    options,
    expectedPostId,
    expectedUserIdFrom,
    expectedUserIdTo,
  ): void {
    expect(model.event_id).toBe(eventIdDictionary.getUserHasMentionedYouInPost());

    expect(model.data.post.id).toBe(expectedPostId);
    expect(model.data.post.User.id).toBe(expectedUserIdFrom);
    postsHelper.checkPostItselfCommonFields(model.data.post, options);
    usersHelper.checkIncludedUserPreview(model.data.post);

    expect(model.target_entity.User.id).toBe(expectedUserIdTo);
    usersHelper.checkIncludedUserPreview(model.target_entity);
  }

  static checkUserMentionsYouInsideComment(
    model: any,
    options: any,
    expectedCommentId: number,
    expectedUserIdFrom: number,
    expectedUserIdTo: number,
  ): void {
    expect(model.event_id).toBe(eventIdDictionary.getUserHasMentionedYouInComment());

    expect(model.data.comment.id).toBe(expectedCommentId);
    commentsHelper.checkOneCommentPreviewFields(model.data.comment, options);
    postsHelper.checkPostItselfCommonFields(model.data.comment.post, options);

    expect(model.data.comment.User.id).toBe(expectedUserIdFrom);
    usersHelper.checkIncludedUserPreview(model.data.comment);

    expect(model.target_entity.User.id).toBe(expectedUserIdTo);
    usersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @param {number} expectedDataPostId
   * @param {number} expectedTargetEntityPostId
   */
  static checkUserRepostsOrgPost(model, options, expectedDataPostId, expectedTargetEntityPostId) {
    expect(model.event_id).toBe(eventIdDictionary.getUserRepostsOrgPost());

    this.checkOneRepostForNotification(model.data.post, false);

    postsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.post);
    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);

    expect(model.data.post.id).toBe(expectedDataPostId);
    expect(model.target_entity.post.id).toBe(expectedTargetEntityPostId);
  }

  /**
   * @param {Object} model
   */
  static checkOrgUsersTeamInvitationNotification(model) {
    expect(model.event_id).toBe(eventIdDictionary.getOrgUsersTeamInvitation());

    orgHelper.checkOneOrganizationPreviewFields(model.data.organization);

    usersHelper.checkIncludedUserPreview(model.data);
    usersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   */
  static checkUserFollowsYouNotification(model) {
    expect(model.event_id).toBe(eventIdDictionary.getUserFollowsYou());

    usersHelper.checkIncludedUserPreview(model.data);
    usersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   */
  static checkUserFollowsOrgNotification(model) {
    expect(model.event_id).toBe(eventIdDictionary.getUserFollowsOrg());

    usersHelper.checkIncludedUserPreview(model.data);
    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserUpvotesPostOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(eventIdDictionary.getUserUpvotesPostOfOtherUser());

    usersHelper.checkIncludedUserPreview(model.data);

    postsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.post);
  }

  static checkUserDownvotesPostOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(eventIdDictionary.getUserDownvotesPostOfOtherUser());

    usersHelper.checkIncludedUserPreview(model.data);

    postsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.post);
  }

  static checkUserUpvotesCommentOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(eventIdDictionary.getUserUpvotesCommentOfOtherUser());

    usersHelper.checkIncludedUserPreview(model.data);

    commentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, options);

    postsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.comment);
  }

  static checkUserDownvotesCommentOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(eventIdDictionary.getUserDownvotesCommentOfOtherUser());

    usersHelper.checkIncludedUserPreview(model.data);

    commentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, options);

    postsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.comment);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserUpvotesPostOfOrg(model, options = {}) {
    expect(model.event_id).toBe(eventIdDictionary.getUserUpvotesPostOfOrg());

    usersHelper.checkIncludedUserPreview(model.data);

    postsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.post);

    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);
  }

  static checkUserDownvotesPostOfOrg(model, options = {}) {
    expect(model.event_id).toBe(eventIdDictionary.getUserDownvotesPostOfOrg());

    usersHelper.checkIncludedUserPreview(model.data);

    postsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.post);

    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserUpvotesCommentOfOrg(model, options = {}) {
    expect(model.event_id).toBe(eventIdDictionary.getUserUpvotesCommentOfOrg());

    usersHelper.checkIncludedUserPreview(model.data);
    commentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg',
    });
    usersHelper.checkIncludedUserPreview(model.target_entity.comment);

    postsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserDownvotesCommentOfOrg(model, options = {}) {
    expect(model.event_id).toBe(eventIdDictionary.getUserDownvotesCommentOfOrg());

    usersHelper.checkIncludedUserPreview(model.data);
    commentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg',
    });
    usersHelper.checkIncludedUserPreview(model.target_entity.comment);

    postsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @private
   */
  static checkUserCommentsPostNotification(model, options) {
    commentsHelper.checkOneCommentPreviewFields(model.data.comment, options);
    usersHelper.checkIncludedUserPreview(model.data.comment);
    postsHelper.checkPostItselfCommonFields(model.data.comment.post, options);

    postsHelper.checkPostItselfCommonFields(model.target_entity.post, options);

    usersHelper.checkIncludedUserPreview(model.target_entity.post);
  }
  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @private
   */
  static checkUserCommentsOrgPostNotification(model, options) {
    commentsHelper.checkOneCommentPreviewFields(model.data.comment, options);
    usersHelper.checkIncludedUserPreview(model.data.comment);

    postsHelper.checkPostItselfCommonFields(model.data.comment.post, options);

    postsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.post);

    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);
  }

  static checkUserCommentsOrgCommentNotification(model) {
    expect(model.event_id).toBe(eventIdDictionary.getUserCommentsOrgComment());

    commentsHelper.checkOneCommentPreviewFields(model.data.comment, {
      postProcessing: 'notification',
    });

    usersHelper.checkIncludedUserPreview(model.data.comment);

    commentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg',
    });

    usersHelper.checkIncludedUserPreview(model.target_entity.comment);
    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
  }

  static checkUserCreatesDirectPostForOtherUser(model, options) {
    postsHelper.checkPostItselfCommonFields(model.data.post, options);
    usersHelper.checkIncludedUserPreview(model.data.post);

    usersHelper.checkIncludedUserPreview(model.target_entity);
  }

  static checkUserCreatesDirectPostForOrg(model, options) {
    postsHelper.checkPostItselfCommonFields(model.data.post, options);
    usersHelper.checkIncludedUserPreview(model.data.post);

    orgHelper.checkOneOrganizationPreviewFields(model.target_entity.organization);
    usersHelper.checkIncludedUserPreview(model.target_entity.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   * @private
   */
  static checkUserCommentsOtherCommentNotification(model, options) {
    commentsHelper.checkOneCommentPreviewFields(model.data.comment, options);
    usersHelper.checkIncludedUserPreview(model.data.comment);

    postsHelper.checkPostItselfCommonFields(model.data.comment.post, options);

    commentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, options);
    usersHelper.checkIncludedUserPreview(model.target_entity.comment);

    postsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
  }

  /**
   *
   * @param {Object[]} posts
   * @param {number|null} expectedLength
   * @param {Object} options
   */
  static checkPostsListFromApi(posts, expectedLength = null, options: any = {}) {
    if (expectedLength) {
      expect(posts.length).toBe(expectedLength);
    } else {
      expect(posts.length).toBeGreaterThan(0);
    }

    posts.forEach((post) => {
      this.checkOneListPostFromApi(post, options);
      this.checkCreatedAtUpdatedAtFormat(post);

      if (options.comments) {
        expect(post.comments).toBeDefined();
        expect(post.comments).not.toBeNull();

        this.checkManyCommentsPreviewWithRelations(post.comments.data, options);
      }
    });
  }

  private static checkCreatedAtUpdatedAtFormat(model) {
    expect(model.created_at).toMatch('Z');
    expect(model.created_at).toMatch('T');

    expect(model.updated_at).toMatch('Z');
    expect(model.updated_at).toMatch('T');
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

    postsHelper.checkPostItselfCommonFields(post, options);
    usersHelper.checkIncludedUserPreview(post);
    orgHelper.checkOneOrgPreviewFieldsIfExists(post);

    this.checkMyselfData(post, options);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  static checkOnePostForPage(post, options) {
    expect(_.isEmpty(post)).toBeFalsy();

    postsHelper.checkPostItselfCommonFields(post, options);
    usersHelper.checkIncludedUserForEntityPage(post, options);
    orgHelper.checkOneOrgPreviewFieldsIfExists(post);

    this.checkMyselfData(post, options);

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

    postsHelper.checkPostItselfCommonFields(post.post, options);

    usersHelper.checkIncludedUserPreview(post);
    usersHelper.checkIncludedUserPreview(post.post);

    if (isOrg) {
      orgHelper.checkOneOrganizationPreviewFields(post.post.organization);
    } else {
      expect(post.post.organization).toBeFalsy();
    }

    this.checkMyselfData(post, options);
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
    usersHelper.checkIncludedUserPreview(post);

    if (isOrg) {
      orgHelper.checkOneOrganizationPreviewFields(post.post.organization);
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
    await postsHelper.expectPostDbValues(post, {
      post_type_id: ContentTypeDictionary.getTypeDirectPost(),
      user_id: author.id,
      ...expectedValues,
    });

    // entity_stats - comments count // #task
    // myself data - upvoting, editable, org member // #task

    // check that related models are created
  }

  private static checkMyselfData(post, options) {
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

export = CommonHelper;
