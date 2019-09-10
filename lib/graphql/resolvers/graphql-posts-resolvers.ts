import {
  UsersRequestQueryDto,
} from '../../users/interfaces/model-interfaces';
import {
  RequestQueryComments,
  RequestQueryDto,
} from '../../api/filters/interfaces/query-filter-interfaces';
import { PostModelResponse, PostRequestQueryDto, PostsListResponse } from '../../posts/interfaces/model-interfaces';

const { ForbiddenError } = require('apollo-server-express');

import AuthService = require('../../auth/authService');
import OneUserInputProcessor = require('../../users/input-processor/one-user-input-processor');
import PostsFetchService = require('../../posts/service/posts-fetch-service');
import ApiPostEvents = require('../../common/service/api-post-events');

export const graphqlPostsResolvers = {
  // @ts-ignore
  async many_posts(parent, args, ctx): Promise<PostsListResponse> {
    const postsQuery: PostRequestQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,
      include: [
        'comments',
      ],
      included_query: {
        comments: args.comments_query,
      },
    };

    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    return PostsFetchService.findManyPosts(postsQuery, currentUserId);
  },
  // @ts-ignore
  async posts_feed(parent, args, ctx): Promise<PostsListResponse> {
    const postsQuery: PostRequestQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,
    };

    if (args.include) {
      // @ts-ignore - it is read only
      postsQuery.included_query = args.include;
    }

    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    return PostsFetchService.findManyPosts(postsQuery, currentUserId);
  },
  /**
     * @deprecated
     */
  // @ts-ignore
  // eslint-disable-next-line sonarjs/no-identical-functions
  async posts(parent, args, ctx): Promise<PostsListResponse> {
    const postsQuery: PostRequestQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,
      include: [
        'comments',
      ],
      included_query: {
        comments: args.comments_query,
      },
    };

    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    return PostsFetchService.findManyPosts(postsQuery, currentUserId);
  },
  // @ts-ignore
  async one_post_offer(parent, args, ctx): PostModelResponse {
    // MaintenanceHelper.hideAirdropsOfferIfRequired(ctx.req, args.id);
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    const commentsQuery: RequestQueryComments = args.comments_query;
    commentsQuery.depth = 0;

    const usersTeamQuery: UsersRequestQueryDto = {
      page: args.users_team_query.page,
      per_page: args.users_team_query.per_page,
      sort_by: args.users_team_query.order_by,
      ...args.users_team_query.filters,
    };

    return PostsFetchService.findOnePostOfferWithAirdrop(args.id, currentUserId, commentsQuery, usersTeamQuery);
  },

  async one_post(
    // @ts-ignore
    parent,
    args,
    ctx,
  ): Promise<PostModelResponse | null> {
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    const commentsQuery: RequestQueryComments = args.comments_query;
    commentsQuery.depth = 0;

    const postId: number = args.id;

    const post = await PostsFetchService.findOnePostByIdAndProcessV2(postId, currentUserId, commentsQuery);

    await ApiPostEvents.processForPostAndChangeProps(currentUserId, post, ctx.req);

    return post;
  },
  // @ts-ignore
  async user_wall_feed(parent, args, ctx, info): PostsListResponse {
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    const postsQuery: RequestQueryDto = {
      page: args.page,
      per_page: args.per_page,
      include: [
        'comments',
      ],
      included_query: {
        comments: args.comments_query,
      },
    };

    let userId: number = args.user_id;
    if (args.filters) {
      userId = await OneUserInputProcessor.getUserIdByFilters(args.filters);
    }

    return PostsFetchService.findAndProcessAllForUserWallFeed(
      userId,
      currentUserId,
      postsQuery,
    );
  },
  // @ts-ignore
  async org_wall_feed(parent, args, ctx, info): PostsListResponse {
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    const postsQuery: RequestQueryDto = {
      page: args.page,
      per_page: args.per_page,
      include: [
        'comments',
      ],
      included_query: {
        comments: args.comments_query,
      },
    };

    return PostsFetchService.findAndProcessAllForOrgWallFeed(
      args.organization_id,
      currentUserId,
      postsQuery,
    );
  },
  // @ts-ignore
  async tag_wall_feed(parent, args, ctx, info): PostsListResponse {
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    const postsQuery: RequestQueryDto = {
      page: args.page,
      per_page: args.per_page,
      include: [
        'comments',
      ],
      included_query: {
        comments: args.comments_query,
      },
    };

    const tagIdentity: string = args.tag_identity;
    return PostsFetchService.findAndProcessAllForTagWallFeed(
      tagIdentity,
      currentUserId,
      postsQuery,
    );
  },
  // @ts-ignore
  async user_news_feed(parent, args, ctx, info): PostsListResponse {
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    if (!currentUserId) {
      throw new ForbiddenError('Auth token is required', 403);
    }

    const postsQuery: RequestQueryDto = {
      page: args.page,
      per_page: args.per_page,
      include: [
        'comments',
      ],
      included_query: {
        comments: args.comments_query,
      },
    };

    return PostsFetchService.findAndProcessAllForMyselfNewsFeed(
      postsQuery,
      currentUserId,
    );
  },
};
