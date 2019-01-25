/* eslint-disable max-len */
/* tslint:disable:max-line-length */
import { DbParamsDto, RequestQueryComments, RequestQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';
import { PostModelResponse, PostsListResponse } from '../interfaces/model-interfaces';

import PostsRepository = require('../posts-repository');
import OrganizationsRepository = require('../../organizations/repository/organizations-repository');

const queryFilterService  = require('../../api/filters/query-filter-service');
const apiPostProcessor    = require('../../common/service').PostProcessor;
const usersFeedRepository = require('../../common/repository').UsersFeed;

const usersActivityRepository    = require('../../users/repository/users-activity-repository');
const commentsFetchService = require('../../comments/service/comments-fetch-service');

class PostsFetchService {
  /**
   * deprecated - only for old APIs
   * @param postId
   * @param currentUserId
   */
  public static async findOnePostByIdAndProcess(
    postId: number,
    currentUserId: number | null,
  ): Promise<PostModelResponse | null> {
    const post = await PostsRepository.findOneById(postId, currentUserId, true);

    if (!post) {
      return null;
    }

    let userToUserActivity = null;
    let currentUserPostActivity: any = null;

    if (currentUserId) {
      userToUserActivity =
        await usersActivityRepository.findOneUserActivityWithInvolvedUsersData(post.user_id);

      const postsActivity = await usersActivityRepository.findOneUserToPostsVotingAndRepostActivity(currentUserId, [postId]);
      currentUserPostActivity = {
        posts: postsActivity,
      };
    }

    let orgTeamMembers = [];
    if (post.organization_id) {
      orgTeamMembers = await OrganizationsRepository.findAllTeamMembersIds(post.organization_id);
    }

    return apiPostProcessor.processOnePostFully(post, currentUserId, currentUserPostActivity, userToUserActivity, orgTeamMembers);
  }

  public static async findOnePostByIdAndProcessV2(
    postId: number,
    currentUserId: number | null,
    commentsQuery: RequestQueryComments,
  ): Promise<PostModelResponse | null> {
    const post = await PostsRepository.findOneByIdV2(postId, true);

    if (!post) {
      return null;
    }

    let userToUserActivity = null;
    let currentUserPostActivity: any = null;

    if (currentUserId) {
      userToUserActivity =
        await usersActivityRepository.findOneUserActivityWithInvolvedUsersData(post.user_id);

      const postsActivity = await usersActivityRepository.findOneUserToPostsVotingAndRepostActivity(currentUserId, [postId]);
      currentUserPostActivity = {
        posts: postsActivity,
      };
    }

    let orgTeamMembers = [];
    if (post.organization_id) {
      orgTeamMembers = await OrganizationsRepository.findAllTeamMembersIds(post.organization_id);
    }

    apiPostProcessor.processOnePostFully(post, currentUserId, currentUserPostActivity, userToUserActivity, orgTeamMembers);

    post.comments = await commentsFetchService.findAndProcessCommentsByPostId(
      postId,
      currentUserId,
      commentsQuery,
    );

    return post;
  }

  public static async findAndProcessAllForUserWallFeed(
    userId: number,
    currentUserId: number | null,
    query: RequestQueryDto | null = null,
  ): Promise<PostsListResponse> {
    const params: DbParamsDto = queryFilterService.getQueryParameters(query);

    const includeProcessor = usersFeedRepository.getIncludeProcessor();
    includeProcessor(query, params);

    const findCountPromises: Promise<any>[] = [
      usersFeedRepository.findAllForUserWallFeed(userId, params),
      usersFeedRepository.countAllForUserWallFeed(userId),
    ];

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  public static async findAndProcessAllForOrgWallFeed(
    orgId: number,
    currentUserId: number | null,
    query: RequestQueryDto,
  ): Promise<PostsListResponse> {
    const params: DbParamsDto = queryFilterService.getQueryParameters(query);
    queryFilterService.processWithIncludeProcessor(usersFeedRepository, query, params);

    const findCountPromises: Promise<any>[] = this.getFindCountPromisesForOrg(orgId, params);

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  private static getFindCountPromisesForOrg(
    orgId: number,
    params: DbParamsDto,
  ): Promise<any>[] {
    return [
      usersFeedRepository.findAllForOrgWallFeed(orgId, params),
      usersFeedRepository.countAllForOrgWallFeed(orgId),
    ];
  }

  /**
   *
   * @param {Object} query
   * @param {number} currentUserId
   * @return {Promise<any>}
   */
  public static async findAndProcessAllForMyselfNewsFeed(
    query: RequestQueryDto,
    currentUserId: number,
  ) {
    const params: DbParamsDto = queryFilterService.getQueryParameters(query);

    const includeProcessor = usersFeedRepository.getIncludeProcessor();
    includeProcessor(query, params);

    const { orgIds, usersIds }: { orgIds: number[], usersIds: number[] } =
      await usersActivityRepository.findOneUserFollowActivity(currentUserId);

    const findCountPromises = [
      usersFeedRepository.findAllForUserNewsFeed(currentUserId, usersIds, orgIds, params),
      usersFeedRepository.countAllForUserNewsFeed(currentUserId, usersIds, orgIds),
    ];

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  /**
   *
   * @param tagTitle
   * @param currentUserId
   * @param query
   * @returns {Promise<any>}
   */
  public static async findAndProcessAllForTagWallFeed(tagTitle, currentUserId, query) {
    const params = queryFilterService.getQueryParameters(query, {}, []);

    const findCountPromises = [
      usersFeedRepository.findAllPostsForWallFeedByTag(tagTitle, params),
      usersFeedRepository.countAllPostsForWallFeedByTag(tagTitle),
    ];

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  /**
   *
   * @param {Object} query
   * @param {Object} params
   * @param {number} currentUserId
   * @param {Promise[]} findCountPromises
   * @return {Promise<any>}
   * @private
   */
  private static async findAndProcessAllForWallFeed(
    query,
    params,
    currentUserId,
    findCountPromises: Promise<any>[],
  ): Promise<PostsListResponse> {
    const [posts, totalAmount] = await Promise.all(findCountPromises);

    const idToPost = {};
    const postsIds: number[] = [];
    // @ts-ignore
    for (const post of posts) {
      idToPost[post.id] = post;
      postsIds.push(+post.id);
    }

    let userActivity;
    if (currentUserId) {
      const postsActivity = await usersActivityRepository.findOneUserToPostsVotingAndRepostActivity(
        currentUserId,
        postsIds,
      );

      userActivity = {
        posts: postsActivity,
      };
    }

    // #task - use included query
    if (query && query.included_query && query.included_query.comments) {
      // #task - prototype realization for demo, N+1 issue
      for (const id of postsIds) {
        // #task - should be defined as default parameters for comments pagination
        const commentsQuery = query.included_query.comments;
        commentsQuery.depth = 0;

        idToPost[id].comments = await commentsFetchService.findAndProcessCommentsByPostId(
          id,
          currentUserId,
          commentsQuery,
        );
      }
    }

    const data      = apiPostProcessor.processManyPosts(posts, currentUserId, userActivity);
    const metadata  = queryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }
}

export = PostsFetchService;
