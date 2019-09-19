/* tslint:disable:max-line-length */
/* eslint-disable max-len */
import { ContentTypesDictionary } from 'ucom.libs.common';
import { DbParamsDto, RequestQueryComments, RequestQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';
import {
  PostModel, PostModelResponse, PostRequestQueryDto, PostsListResponse,
} from '../interfaces/model-interfaces';
import { ApiLogger } from '../../../config/winston';
import { AppError, BadRequestError } from '../../api/errors';
import { OrgModelCard } from '../../organizations/interfaces/model-interfaces';
import { UserIdToUserModelCard, UserModel, UsersRequestQueryDto } from '../../users/interfaces/model-interfaces';

import { StringToAnyCollection } from '../../common/interfaces/common-types';

const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

import PostsRepository = require('../posts-repository');
import OrganizationsRepository = require('../../organizations/repository/organizations-repository');
import UsersFeedRepository = require('../../common/repository/users-feed-repository');
import ApiPostProcessor = require('../../common/service/api-post-processor');
import UsersModelProvider = require('../../users/users-model-provider');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import OrganizationsFetchService = require('../../organizations/service/organizations-fetch-service');
import UsersFetchService = require('../../users/service/users-fetch-service');
import EntityListCategoryDictionary = require('../../stats/dictionary/entity-list-category-dictionary');
import PostsModelProvider = require('./posts-model-provider');
import AirdropFetchService = require('../../airdrops/service/airdrop-fetch-service');

import UsersActivityEventsViewRepository = require('../../users/repository/users-activity/users-activity-events-view-repository');

const queryFilterService  = require('../../api/filters/query-filter-service');
const usersActivityRepository    = require('../../users/repository/users-activity-repository');

const commentsFetchService = require('../../comments/service/comments-fetch-service');

/**
 * This service never changes any persistent data (ex. object properties in DB)
 */
class PostsFetchService {
  public static isDirectPost(post) {
    return post.post_type_id === ContentTypesDictionary.getTypeDirectPost();
  }

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

    await this.processEntityForCardForRepost(post);

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

  public static async findOnePostOfferWithAirdrop(
    postId: number,
    currentUserId: number | null,
    commentsQuery: RequestQueryComments,
    usersRequestQuery: UsersRequestQueryDto,
  ): Promise<PostModelResponse | null> {
    const post = await this.findOnePostByIdAndProcessV2(postId, currentUserId, commentsQuery);
    if (!post) {
      throw new BadRequestError(`There is no post with ID: ${postId}`, 404);
    }

    await AirdropFetchService.addDataForGithubAirdropOffer(post, currentUserId, usersRequestQuery);

    return post;
  }

  public static async findOnePostByIdAndProcessV2(
    postId: number,
    currentUserId: number | null,
    commentsQuery: RequestQueryComments,
  ): Promise<PostModelResponse> {
    const post = await PostsRepository.findOneByIdV2(postId, true);

    if (!post) {
      throw new BadRequestError(`There is no post with ID: ${postId}`, 404);
    }

    const entityFor = await this.getEntityFor(post);
    if (entityFor) {
      post.entity_for_card = await this.getEntityFor(post);
    }

    await this.processEntityForCardForRepost(post);

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

    post.views_count = await UsersActivityEventsViewRepository.getViewsCountForEntity(postId, EntityNames.POSTS);

    return post;
  }

  public static async findManyPosts(
    query: PostRequestQueryDto,
    currentUserId: number | null,
  ): Promise<PostsListResponse> {
    const repository = PostsRepository;

    this.processForTrendingAndHotBackwardCompatibility(query);

    const params: DbParamsDto = queryFilterService.getQueryParametersWithRepository(query, repository);
    queryFilterService.processWithIncludeProcessor(repository, query, params);

    if (query.entity_state === 'card') {
      params.attributes = PostsModelProvider.getPostsFieldsForCard();
    }

    const findCountPromises: Promise<any>[] = this.getFindCountPromisesForAllPosts(params);

    return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  public static async findAndProcessAllForUserWallFeed(
    userId: number,
    currentUserId: number | null,
    requestQuery: PostRequestQueryDto,
  ): Promise<PostsListResponse> {
    const params: DbParamsDto = queryFilterService.getQueryParameters(requestQuery);

    const includeProcessor = UsersFeedRepository.getIncludeProcessor();
    includeProcessor(requestQuery, params);

    const findCountPromises: Promise<any>[] = [
      UsersFeedRepository.findAllForUserWallFeed(userId, params, requestQuery),
      UsersFeedRepository.countAllForUserWallFeed(userId, requestQuery),
    ];

    return this.findAndProcessAllForWallFeed(requestQuery, params, currentUserId, findCountPromises);
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
      UsersFeedRepository.findAllForUserNewsFeed(currentUserId, usersIds, orgIds, params, query),
      UsersFeedRepository.countAllForUserNewsFeed(currentUserId, usersIds, orgIds, query),
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

  private static async processEntityForCardForRepost(post: PostModelResponse): Promise<void> {
    // #task - it is not optimal. Here is N+1 problem. it is required to use JOIN or REDIS cache
    if (post.post_type_id !== ContentTypesDictionary.getTypeRepost()) {
      return;
    }

    post.post!.entity_for_card = await this.getEntityFor(post.post!);
  }

  private static async getEntityFor(
    post: PostModel,
  ): Promise<OrgModelCard | UserModel | null> {
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
    query: PostRequestQueryDto,
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
    if (currentUserId && query.entity_state !== 'card') {
      const postsActivity = await usersActivityRepository.findOneUserToPostsVotingAndRepostActivity(
        currentUserId,
        postsIds,
      );

      userActivity = {
        posts: postsActivity,
      };
    }

    if (query && query.included_query && query.included_query.comments) {
      await this.addCommentsToPosts(
        posts,
        postsIds,
        query.included_query.comments,
        currentUserId,
      );
    }

    const data = ApiPostProcessor.processManyPosts(posts, currentUserId, userActivity);
    if (query.entity_state !== 'card') {
      await this.addEntityForCard(posts, data);

      for (const post of posts) {
        await this.processEntityForCardForRepost(post);
      }
    }

    const metadata  = queryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }

  private static async addEntityForCard(posts, data) {
    // #task - maybe use JOIN instead (knex and good hydration is required) or provide Card REDIS caching
    const postIdToEntityForCard = await this.getPostIdToEntityForCard(posts);
    data.forEach((post) => {
      if (postIdToEntityForCard[post.id]) {
        post.entity_for_card = postIdToEntityForCard[post.id];
      } else {
        ApiLogger.error(`there is no entityForCard record for post: ${JSON.stringify(post)}. Skipped...`);
      }
    });
  }

  private static async getPostIdToEntityForCard(
    posts: PostModelResponse[],
  ): Promise<{[index: number]: OrgModelCard | UserModel}> {
    const entityIdForParams =  this.getEntityIdForParams(posts);

    const orgIds = entityIdForParams[OrganizationsModelProvider.getEntityName()].ids;
    delete entityIdForParams[OrganizationsModelProvider.getEntityName()].ids;

    const usersIds = entityIdForParams[UsersModelProvider.getEntityName()].ids;
    delete entityIdForParams[OrganizationsModelProvider.getEntityName()].ids;

    const postIdToEntityCard = {};

    if (usersIds.length > 0) {
      const users: UserIdToUserModelCard =
        await UsersFetchService.findManyAndProcessForCard(usersIds);
      for (const postId in entityIdForParams[UsersModelProvider.getEntityName()]) {
        if (!entityIdForParams[UsersModelProvider.getEntityName()].hasOwnProperty(postId)) {
          continue;
        }

        const userId: number = entityIdForParams[UsersModelProvider.getEntityName()][postId];
        postIdToEntityCard[postId] = users[userId];
      }
    }

    if (orgIds.length > 0) {
      const orgs = await OrganizationsFetchService.findManyAndProcessForCard(orgIds);
      for (const postId in entityIdForParams[OrganizationsModelProvider.getEntityName()]) {
        if (!entityIdForParams[OrganizationsModelProvider.getEntityName()].hasOwnProperty(postId)) {
          continue;
        }

        const orgId: number = entityIdForParams[OrganizationsModelProvider.getEntityName()][postId];
        postIdToEntityCard[postId] = orgs[orgId];
      }
    }

    return postIdToEntityCard;
  }

  private static getEntityIdForParams(
    posts: PostModelResponse[],
  ): StringToAnyCollection {
    const expectedEntityNameFor = [
      OrganizationsModelProvider.getEntityName(),
      UsersModelProvider.getEntityName(),
    ];

    const res = {
      [OrganizationsModelProvider.getEntityName()]: {
        ids: [],
      },
      [UsersModelProvider.getEntityName()]: {
        ids: [],
      },
    };

    posts.forEach((post) => {
      if (!post.entity_name_for || !(~expectedEntityNameFor.indexOf(post.entity_name_for))) {
        throw new AppError(`Unsupported entity_name_for: ${post.entity_name_for}. Processed post body: ${JSON.stringify(post)}`, 500);
      }

      const entityNameFor: string = post.entity_name_for;
      res[entityNameFor][post.id] = +post.entity_id_for;
      // @ts-ignore
      res[entityNameFor].ids.push(+post.entity_id_for);
    });

    res[OrganizationsModelProvider.getEntityName()].ids =
      [...new Set(res[OrganizationsModelProvider.getEntityName()].ids)];

    res[UsersModelProvider.getEntityName()].ids =
      [...new Set(res[UsersModelProvider.getEntityName()].ids)];

    return res;
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

  private static processForTrendingAndHotBackwardCompatibility(query: PostRequestQueryDto): void {
    if (query.sort_by === '-current_rate_delta_daily') {
      // @ts-ignore
      query.overview_type = EntityListCategoryDictionary.getTrending();
      // @ts-ignore
      query.sort_by = '-importance_delta';
    }

    if (query.created_at && query.created_at === '24_hours' && query.sort_by === '-current_rate') {
      // @ts-ignore
      query.overview_type = EntityListCategoryDictionary.getHot();
      // @ts-ignore
      query.sort_by = '-activity_index_delta';
    }
  }
}

export = PostsFetchService;
