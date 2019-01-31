/* eslint-disable max-len */
/* tslint:disable:max-line-length */
import { DbParamsDto, RequestQueryComments, RequestQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';
import { PostModel, PostModelResponse, PostRequestQueryDto, PostsListResponse } from '../interfaces/model-interfaces';
import { ApiLogger } from '../../../config/winston';

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

import PostsRepository = require('../posts-repository');
import OrganizationsRepository = require('../../organizations/repository/organizations-repository');
import UsersFeedRepository = require('../../common/repository/users-feed-repository');
import ApiPostProcessor = require('../../common/service/api-post-processor');
import UsersModelProvider = require('../../users/users-model-provider');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import { AppError } from '../../api/errors';
import OrganizationsFetchService = require('../../organizations/service/organizations-fetch-service');
import { OrgModelCard } from '../../organizations/interfaces/model-interfaces';
import UsersFetchService = require('../../users/service/users-fetch-service');
import { UserModel } from '../../users/interfaces/model-interfaces';

const queryFilterService  = require('../../api/filters/query-filter-service');

const usersActivityRepository    = require('../../users/repository/users-activity-repository');
const commentsFetchService = require('../../comments/service/comments-fetch-service');

/**
 * This service never changes any persistent data (ex. object properties in DB)
 */
class PostsFetchService {
  /**
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

    const entityFor = await this.getEntityFor(post);
    if (entityFor) {
      post.entity_for_card = await this.getEntityFor(post);
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

    return ApiPostProcessor.processOnePostFully(post, currentUserId, currentUserPostActivity, userToUserActivity, orgTeamMembers);
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

    const entityFor = await this.getEntityFor(post);
    if (entityFor) {
      post.entity_for_card = await this.getEntityFor(post);
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

    ApiPostProcessor.processOnePostFully(post, currentUserId, currentUserPostActivity, userToUserActivity, orgTeamMembers);

    post.comments = await commentsFetchService.findAndProcessCommentsByPostId(
      postId,
      currentUserId,
      commentsQuery,
    );

    return post;
  }

  public static async findManyPosts(
    query: PostRequestQueryDto,
    currentUserId: number | null,
  ): Promise<PostsListResponse> {
    const repository = PostsRepository;

    const params: DbParamsDto = queryFilterService.getQueryParametersWithRepository(query, repository);
    queryFilterService.processWithIncludeProcessor(repository, query, params);

    const findCountPromises: Promise<any>[] = this.getFindCountPromisesForAllPosts(params);

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  public static async findAndProcessAllForUserWallFeed(
    userId: number,
    currentUserId: number | null,
    query: RequestQueryDto,
  ): Promise<PostsListResponse> {
    const params: DbParamsDto = queryFilterService.getQueryParameters(query);

    const includeProcessor = UsersFeedRepository.getIncludeProcessor();
    includeProcessor(query, params);

    const findCountPromises: Promise<any>[] = [
      UsersFeedRepository.findAllForUserWallFeed(userId, params),
      UsersFeedRepository.countAllForUserWallFeed(userId),
    ];

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  public static async findAndProcessAllForOrgWallFeed(
    orgId: number,
    currentUserId: number | null,
    query: RequestQueryDto,
  ): Promise<PostsListResponse> {
    const params: DbParamsDto = queryFilterService.getQueryParameters(query);
    queryFilterService.processWithIncludeProcessor(UsersFeedRepository, query, params);

    const findCountPromises: Promise<any>[] = this.getFindCountPromisesForOrg(orgId, params);

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
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

    const includeProcessor = UsersFeedRepository.getIncludeProcessor();
    includeProcessor(query, params);

    const { orgIds, usersIds }: { orgIds: number[], usersIds: number[] } =
      await usersActivityRepository.findOneUserFollowActivity(currentUserId);

    const findCountPromises = [
      UsersFeedRepository.findAllForUserNewsFeed(currentUserId, usersIds, orgIds, params),
      UsersFeedRepository.countAllForUserNewsFeed(currentUserId, usersIds, orgIds),
    ];

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  public static async findAndProcessAllForTagWallFeed(
    tagTitle: string,
    currentUserId: number | null,
    query: RequestQueryDto,
  ): Promise<PostsListResponse> {
    const params: DbParamsDto = queryFilterService.getQueryParameters(query);
    queryFilterService.processWithIncludeProcessor(UsersFeedRepository, query, params);

    const findCountPromises: Promise<any>[] = this.getFindCountPromisesForTag(tagTitle, params);

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  private static async getEntityFor(
    post: PostModel,
  ): Promise<OrgModelCard | UserModel | null> {
    if (post.post_type_id !== ContentTypeDictionary.getTypeDirectPost()) {
      return null;
    }

    switch (post.entity_name_for) {
      case UsersModelProvider.getEntityName():
        return UsersFetchService.findOneAndProcessForCard(post.entity_id_for);
      case OrganizationsModelProvider.getEntityName():
        return OrganizationsFetchService.findOneAndProcessForCard(post.entity_id_for);
      default:
        throw new AppError(`Unsupported entity_name_for: ${post.entity_name_for}`, 500);
    }
  }

  private static getFindCountPromisesForOrg(
    orgId: number,
    params: DbParamsDto,
  ): Promise<any>[] {
    return [
      UsersFeedRepository.findAllForOrgWallFeed(orgId, params),
      UsersFeedRepository.countAllForOrgWallFeed(orgId),
    ];
  }

  private static getFindCountPromisesForTag(
    tagTitle: string,
    params: DbParamsDto,
  ): Promise<any>[] {
    return [
      UsersFeedRepository.findAllPostsForWallFeedByTag(tagTitle, params),
      UsersFeedRepository.countAllPostsForWallFeedByTag(tagTitle),
    ];
  }

  private static getFindCountPromisesForAllPosts(
    params: DbParamsDto,
  ): Promise<any>[] {
    return [
      PostsRepository.findAllPosts(params),
      PostsRepository.countAllPosts(params),
    ];
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
    query: RequestQueryDto,
    params: DbParamsDto,
    currentUserId: number | null,
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
      await this.addCommentsToPosts(
        posts,
        postsIds,
        query.included_query.comments,
        currentUserId,
      );
    }

    const data      = ApiPostProcessor.processManyPosts(posts, currentUserId, userActivity);
    const metadata  = queryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }

  private static async addCommentsToPosts(
    posts: PostModelResponse,
    postsIds: number[],
    commentsQuery: RequestQueryComments,
    currentUserId: number | null,
  ): Promise<void> {
    commentsQuery.depth = 0;

    const idToComments = await commentsFetchService.findAndProcessCommentsByPostsIds(
      postsIds,
      currentUserId,
      commentsQuery,
    );

    posts.forEach((post) => {
      if (!idToComments[post.id]) {
        ApiLogger.error(`There are no comments for post with ID ${post.id} but should be. Filled or empty. Let's set empty and continue`);
        post.comments = ApiPostProcessor.getEmptyListOfModels();
      } else {
        post.comments = idToComments[post.id];
      }
    });
  }
}

export = PostsFetchService;
