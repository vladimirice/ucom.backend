/* eslint-disable max-len */
import { CommentModelResponse, CommentsListResponse } from '../../../lib/comments/interfaces/model-interfaces';
import { PostModelResponse, PostsListResponse } from '../../../lib/posts/interfaces/model-interfaces';
import { CheckerOptions } from '../../generators/interfaces/dto-interfaces';
import { ListResponse } from '../../../lib/common/interfaces/lists-interfaces';
import { UsersListResponse } from '../../../lib/users/interfaces/model-interfaces';
import { OrgModelResponse } from '../../../lib/organizations/interfaces/model-interfaces';

import ResponseHelper = require('./response-helper');
import CommentsHelper = require('./comments-helper');

import _ = require('lodash');
import OrganizationsHelper = require('./organizations-helper');
import UsersHelper = require('./users-helper');
import NotificationsHelper = require('./notifications-helper');
import NotificationsEventIdDictionary = require('../../../lib/entities/dictionary/notifications-event-id-dictionary');
import PostsHelper = require('./posts-helper');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import EntityResponseState = require('../../../lib/common/dictionary/EntityResponseState');
import CommonChecker = require('../../helpers/common/common-checker');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

require('jest-expect-message');

class CommonHelper {
  // #task - improve checkOneOrganizationFully method
  public static checkOneOrganizationFully(model: OrgModelResponse, options) {
    expect(_.isEmpty(model)).toBeFalsy();

    UsersHelper.checkIncludedUserPreview(model, null, options);

    expect(model.users_team).toBeDefined();
    if (options.mustHaveValue.usersTeam) {
      expect(model.users_team.length).toBeGreaterThan(0);

      for (const user of model.users_team) {
        UsersHelper.checkIncludedUserPreview({ User: user }, null, options, ['users_team']);
      }
    }

    expect(model.social_networks).toBeDefined();

    expect(model.current_rate).toBeDefined();
    expect(model.current_rate).not.toBeNull();

    expect(model.discussions).toBeDefined();
    expect(Array.isArray(model.discussions)).toBeTruthy();
    if (options.mustHaveValue.discussions) {
      expect(model.discussions.length).toBeGreaterThan(0);

      options.scopes = ['postDiscussions'];

      this.checkManyPostsV2(model.discussions, options);
    } else {
      expect(model.discussions.length).toBe(0);
    }
  }

  /**
   * deprecated
   * @link checkManyIncludedCommentsV2 - for new APIs
   * @param {Object[]} comments
   * @param {Object} options
   */
  static checkManyCommentsPreviewWithRelations(comments, options: any = {}) {
    comments.forEach((comment) => {
      this.checkOneCommentPreviewWithRelations(comment, options);
    });
  }

  public static checkManyIncludedCommentsV2(model, options: CheckerOptions): void {
    const { comments }: {comments: CommentsListResponse} = model;

    this.checkManyCommentsV2(comments, options);
  }

  public static checkManyCommentsV2(comments: CommentsListResponse, options: CheckerOptions): void {
    ResponseHelper.checkListResponseStructure(comments);

    if (options.comments.isEmpty) {
      expect(comments.data.length).toBe(0);
    } else {
      comments.data.forEach((comment: CommentModelResponse) => {
        this.checkOneCommentV2(comment, options);
      });
    }
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
    CommentsHelper.checkOneCommentPreviewFields(comment, options);
    UsersHelper.checkIncludedUserPreview(comment, null, options);

    ResponseHelper.checkCreatedAtUpdatedAtFormat(comment);

    if (comment.organization_id) {
      OrganizationsHelper.checkOneOrganizationPreviewFields(comment.organization);
    }
  }

  private static checkOneCommentV2(
    comment: CommentModelResponse,
    options,
  ): void {
    CommentsHelper.checkOneCommentItself(comment, options);
    UsersHelper.checkIncludedUserPreview(comment, null, options);

    ResponseHelper.checkCreatedAtUpdatedAtFormat(comment);

    if (comment.organization_id) {
      OrganizationsHelper.checkOneOrganizationPreviewFields(comment.organization);
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
    NotificationsHelper.checkNotificationItselfCommonFields(model);
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
      case NotificationsEventIdDictionary.getOrgUsersTeamInvitation():
        this.checkOrgUsersTeamInvitationNotification(model);
        break;
      case NotificationsEventIdDictionary.getUserFollowsYou():
        this.checkUserFollowsYouNotification(model);
        break;
      case NotificationsEventIdDictionary.getUserFollowsOrg():
        this.checkUserFollowsOrgNotification(model);
        break;
      case NotificationsEventIdDictionary.getUserCommentsPost():
        this.checkUserCommentsPostNotification(model, options);
        break;
      case NotificationsEventIdDictionary.getUserCommentsComment():
        this.checkUserCommentsOtherCommentNotification(model, options);
        break;
      case NotificationsEventIdDictionary.getUserCommentsOrgPost():
        this.checkUserCommentsOrgPostNotification(model, options);
        break;
      case NotificationsEventIdDictionary.getUserCommentsOrgComment():
        this.checkUserCommentsOrgCommentNotification(model);
        break;
      case NotificationsEventIdDictionary.getUserCreatesDirectPostForOtherUser():
        this.checkUserCreatesDirectPostForOtherUser(model, options);
        break;
      case NotificationsEventIdDictionary.getUserCreatesDirectPostForOrg():
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
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserRepostsOtherUserPost());

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
  static checkUserMentionsYouInsidePost(
    model,
    options,
    expectedPostId,
    expectedUserIdFrom,
    expectedUserIdTo,
  ): void {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserHasMentionedYouInPost());

    expect(model.data.post.id).toBe(expectedPostId);
    expect(model.data.post.User.id).toBe(expectedUserIdFrom);
    PostsHelper.checkPostItselfCommonFields(model.data.post, options);
    UsersHelper.checkIncludedUserPreview(model.data.post);

    expect(model.target_entity.User.id).toBe(expectedUserIdTo);
    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  static checkUserMentionsYouInsideComment(
    model: any,
    options: any,
    expectedCommentId: number,
    expectedUserIdFrom: number,
    expectedUserIdTo: number,
  ): void {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserHasMentionedYouInComment());

    expect(model.data.comment.id).toBe(expectedCommentId);
    CommentsHelper.checkOneCommentPreviewFields(model.data.comment, options);
    PostsHelper.checkPostItselfCommonFields(model.data.comment.post, options);

    expect(model.data.comment.User.id).toBe(expectedUserIdFrom);
    UsersHelper.checkIncludedUserPreview(model.data.comment);

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
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserRepostsOrgPost());

    this.checkOneRepostForNotification(model.data.post, false);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);
    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);

    expect(model.data.post.id).toBe(expectedDataPostId);
    expect(model.target_entity.post.id).toBe(expectedTargetEntityPostId);
  }

  /**
   * @param {Object} model
   */
  static checkOrgUsersTeamInvitationNotification(model) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getOrgUsersTeamInvitation());

    OrganizationsHelper.checkOneOrganizationPreviewFields(model.data.organization);

    UsersHelper.checkIncludedUserPreview(model.data);
    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   */
  static checkUserFollowsYouNotification(model) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserFollowsYou());

    UsersHelper.checkIncludedUserPreview(model.data);
    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   */
  static checkUserTrustsYouNotification(model) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserTrustsYou());

    UsersHelper.checkIncludedUserPreview(model.data);
    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  /**
   *
   * @param {Object} model
   */
  static checkUserFollowsOrgNotification(model) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserFollowsOrg());

    UsersHelper.checkIncludedUserPreview(model.data);
    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserUpvotesPostOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserUpvotesPostOfOtherUser());

    UsersHelper.checkIncludedUserPreview(model.data);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);
  }

  static checkUserDownvotesPostOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserDownvotesPostOfOtherUser());

    UsersHelper.checkIncludedUserPreview(model.data);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);
  }

  static checkUserUpvotesCommentOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserUpvotesCommentOfOtherUser());

    UsersHelper.checkIncludedUserPreview(model.data);

    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, options);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);
  }

  static checkUserDownvotesCommentOfOtherUser(model, options = {}) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserDownvotesCommentOfOtherUser());

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
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserUpvotesPostOfOrg());

    UsersHelper.checkIncludedUserPreview(model.data);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);

    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);
  }

  static checkUserDownvotesPostOfOrg(model, options = {}) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserDownvotesPostOfOrg());

    UsersHelper.checkIncludedUserPreview(model.data);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.post, options);
    UsersHelper.checkIncludedUserPreview(model.target_entity.post);

    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserUpvotesCommentOfOrg(model, options = {}) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserUpvotesCommentOfOrg());

    UsersHelper.checkIncludedUserPreview(model.data);
    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg',
    });
    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkUserDownvotesCommentOfOrg(model, options = {}) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserDownvotesCommentOfOrg());

    UsersHelper.checkIncludedUserPreview(model.data);
    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg',
    });
    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);

    PostsHelper.checkPostItselfCommonFields(model.target_entity.comment.post, options);
    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
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

    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.post.organization);
  }

  static checkUserCommentsOrgCommentNotification(model) {
    expect(model.event_id).toBe(NotificationsEventIdDictionary.getUserCommentsOrgComment());

    CommentsHelper.checkOneCommentPreviewFields(model.data.comment, {
      postProcessing: 'notification',
    });

    UsersHelper.checkIncludedUserPreview(model.data.comment);

    CommentsHelper.checkOneCommentPreviewFields(model.target_entity.comment, {
      postProcessing: 'notificationWithOrg',
    });

    UsersHelper.checkIncludedUserPreview(model.target_entity.comment);
    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.comment.organization);
  }

  static checkUserCreatesDirectPostForOtherUser(model, options) {
    PostsHelper.checkPostItselfCommonFields(model.data.post, options);
    UsersHelper.checkIncludedUserPreview(model.data.post);

    UsersHelper.checkIncludedUserPreview(model.target_entity);
  }

  static checkUserCreatesDirectPostForOrg(model, options) {
    PostsHelper.checkPostItselfCommonFields(model.data.post, options);
    UsersHelper.checkIncludedUserPreview(model.data.post);

    OrganizationsHelper.checkOneOrganizationPreviewFields(model.target_entity.organization);
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
  static checkPostsListFromApi(
    posts,
    expectedLength: number | null = null,
    options: any = {},
  ) {
    if (expectedLength) {
      expect(posts.length).toBe(expectedLength);
    } else {
      expect(posts.length).toBeGreaterThan(0);
    }

    posts.forEach((post) => {
      this.checkOneListPostFromApi(post, options);
      ResponseHelper.checkCreatedAtUpdatedAtFormat(post);

      if (options.comments) {
        expect(post.comments).toBeDefined();
        expect(post.comments).not.toBeNull();

        this.checkManyCommentsPreviewWithRelations(post.comments.data, options);
      }
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
    UsersHelper.checkIncludedUserPreview(post, null, options);
    OrganizationsHelper.checkOneOrgPreviewFieldsIfExists(post);

    this.checkMyselfData(post, options);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   */
  public static checkOnePostForPage(post, options) {
    expect(_.isEmpty(post)).toBeFalsy();

    PostsHelper.checkPostItselfCommonFields(post, options);
    UsersHelper.checkIncludedUserForEntityPage(post, options);
    OrganizationsHelper.checkOneOrgPreviewFieldsIfExists(post);

    this.checkMyselfData(post, options);

    if (options.postProcessing === 'full' && !options.skipCommentsChecking) {
      expect(post.comments).toBeDefined();

      this.checkManyCommentsPreviewWithRelations(post.comments, options);
    }
  }

  /**
   * @deprecated
   * @see CommonChecker.expectModelIdsExistenceInResponseList(response, expectedModelIds)
   * @param response
   * @param expectedModelIds
   */
  public static expectModelIdsExistenceInResponseList(
    response: ListResponse,
    expectedModelIds: number[],
  ) {
    CommonChecker.expectModelIdsExistenceInResponseList(response, expectedModelIds);
  }

  /**
   * @deprecated
   * @see CommonChecker.expectModelsExistence(actualModels, expectedModelIds, checkOrdering)
   * @param actualModels
   * @param expectedModelIds
   * @param checkOrdering
   */
  public static expectModelsExistence(
    actualModels,
    expectedModelIds: number[],
    checkOrdering: boolean = false,
  ): void {
    CommonChecker.expectModelsExistence(actualModels, expectedModelIds, checkOrdering);
  }

  /**
   * @deprecated
   * @see CommonChecker.expectModelsDoNotExist(actualModels, expectedModelIds)
   * @param actualModels
   * @param expectedModelIds
   */
  public static expectModelsDoNotExist(
    actualModels: any[],
    expectedModelIds: number[],
  ): void {
    CommonChecker.expectModelsDoNotExist(actualModels, expectedModelIds);
  }

  private static getCheckerOptionsWithoutOrg(
    isMyself: boolean,
    areCommentsEmpty: boolean,
    isAuthorMyselfData: boolean,
  ): CheckerOptions {
    return {
      model: {
        myselfData: isMyself,
      },
      postProcessing: 'list',
      comments: {
        myselfData: isMyself,
        isEmpty: areCommentsEmpty,
      },
      author: {
        myselfData: isAuthorMyselfData,
      },
      organization: {
        required: false,
      },
      ...UsersHelper.propsAndCurrentParamsOptions(isMyself),
    };
  }

  public static checkPostListResponseWithoutOrg(
    response: PostsListResponse,
    isMyself: boolean,
    isCommentsEmpty: boolean,
    isAuthorMyselfData: boolean = false,
  ) {
    const options: CheckerOptions = this.getCheckerOptionsWithoutOrg(isMyself, isCommentsEmpty, isAuthorMyselfData);

    this.expectPostListResponse(response, options);
  }

  public static checkUsersListResponseWithProps(response: UsersListResponse, isMyself: boolean): void {
    const usersCheckOptions = {
      author: {
        myselfData: isMyself,
      },
      current_params: true,
      uos_accounts_properties: true,
    };

    this.checkUsersListResponse(response, usersCheckOptions);
  }

  public static checkUsersListResponse(
    response: UsersListResponse,
    options,
  ) {
    ResponseHelper.checkListResponseStructure(response);

    response.data.forEach((item) => {
      UsersHelper.checkIncludedUserForEntityPage({ User: item }, options);
    });
  }

  public static checkUsersListResponseForMyselfData(
    response: UsersListResponse,
    allowEmpty: boolean = false,
  ): void {
    ResponseHelper.checkListResponseStructure(response);

    const options = {
      author: {
        myselfData: true,
      },
    };

    if (!allowEmpty) {
      expect(response.data.length).toBeGreaterThan(0);
    }

    response.data.forEach((item) => {
      UsersHelper.checkIncludedUserForEntityPage({ User: item }, options);
    });
  }

  public static expectPostListResponse(
    response: PostsListResponse,
    options: CheckerOptions,
  ): void {
    ResponseHelper.checkListResponseStructure(response);

    this.checkManyPostsV2(response.data, options);
  }

  public static checkOnePostV2WithoutOrg(
    post: PostModelResponse,
    isMyselfData: boolean,
    isCommentsEmpty: boolean,
    isAuthorMyselfData: boolean = false,
  ): void {
    const options = this.getCheckerOptionsWithoutOrg(isMyselfData, isCommentsEmpty, isAuthorMyselfData);

    this.checkOnePostV2(post, options);
  }

  public static checkManyPostsV2(
    posts: PostModelResponse[],
    options: CheckerOptions,
  ): void {
    posts.forEach(post => this.checkOnePostV2(post, options));
  }

  public static checkOnePostV2(
    post: PostModelResponse,
    options: CheckerOptions,
  ): void {
    expect(_.isEmpty(post)).toBeFalsy();

    PostsHelper.checkPostItselfCommonFields(post, options);

    UsersHelper.checkIncludedUserForEntityPage(post, options);
    if (options.postProcessing !== EntityResponseState.card()) {
      this.checkOnePostEntityForCard(post);
      this.checkMyselfData(post, options);
      this.checkPostTypeRelatedStructure(post, options);
      if (options.comments) {
        this.checkManyIncludedCommentsV2(post, options);
      }

      if (options.organization && options.organization.required) {
        expect(post.organization_id).toBeTruthy();
        expect(post.organization_id).toBe(options.organization.expectedId);

        OrganizationsHelper.checkOneOrganizationPreviewFields(post.organization);
      }
    }

    ResponseHelper.checkCreatedAtUpdatedAtFormat(post);
  }

  /**
   *
   * @param {Object} post
   * @param {Object} options
   * @param {boolean} isOrg
   */
  public static checkOneRepostForList(post, options, isOrg) {
    expect(_.isEmpty(post)).toBeFalsy();
    expect(_.isEmpty(post.post)).toBeFalsy();

    PostsHelper.checkPostItselfCommonFields(post.post, options);

    UsersHelper.checkIncludedUserPreview(post);
    UsersHelper.checkIncludedUserPreview(post.post);

    if (isOrg) {
      OrganizationsHelper.checkOneOrganizationPreviewFields(post.post.organization);
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
  public static checkOneRepostForNotification(post, isOrg) {
    expect(_.isEmpty(post)).toBeFalsy();

    expect(post.user_id).toBeDefined();
    expect(post.id).toBeDefined();

    expect(post.post_type_id).toBe(ContentTypeDictionary.getTypeRepost());
    UsersHelper.checkIncludedUserPreview(post);

    if (isOrg) {
      OrganizationsHelper.checkOneOrganizationPreviewFields(post.post.organization);
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
  public static async checkDirectPostInDb(post, expectedValues = {}, author) {
    await PostsHelper.expectPostDbValues(post, {
      post_type_id: ContentTypeDictionary.getTypeDirectPost(),
      user_id: author.id,
      ...expectedValues,
    });

    // entity_stats - comments count // #task
    // myself data - upvoting, editable, org member // #task

    // check that related models are created
  }

  private static checkMyselfData(post, options) {
    if (options.myselfData || (options.model && options.model.myselfData)) {
      expect(post.myselfData).toBeDefined();

      expect(post.myselfData.myselfVote).toBeDefined();
      expect(post.myselfData.join).toBeDefined();
      expect(post.myselfData.organization_member).toBeDefined();
      expect(post.myselfData.repost_available).toBeDefined();
    } else {
      expect(post.myselfData).not.toBeDefined();
    }
  }

  private static checkPostTypeRelatedStructure(post: PostModelResponse, options) {
    if (post.post_type_id === ContentTypeDictionary.getTypeRepost()) {
      expect(_.isEmpty(post.post)).toBeFalsy();

      const postPostOptions = _.cloneDeep(options);
      postPostOptions.model.myselfData = false;
      postPostOptions.author.myselfData = false;
      delete postPostOptions.comments;

      this.checkOnePostV2(<PostModelResponse>post.post, postPostOptions);
    }
  }

  private static checkOnePostEntityForCard(post: PostModelResponse): void {
    expect(typeof post.entity_id_for).toBe('number');
    expect(post.entity_id_for).toBeGreaterThan(0);
    expect(_.isEmpty(post.entity_name_for)).toBeFalsy();
    expect(_.isEmpty(post.entity_for_card)).toBeFalsy();

    switch (post.entity_name_for) {
      case OrganizationsModelProvider.getEntityName():
        OrganizationsHelper.checkOneOrganizationCardStructure(post.entity_for_card);
        break;
      case UsersModelProvider.getEntityName():
        UsersHelper.checkUserPreview(post.entity_for_card);
        break;
      default:
        throw new Error(`Unsupported entity_name_for: ${post.entity_name_for}`);
    }
  }
}

export = CommonHelper;
