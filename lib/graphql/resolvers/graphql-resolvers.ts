import { RequestQueryBlockchainNodes } from '../../blockchain-nodes/interfaces/blockchain-nodes-interfaces';
import {
  UsersRequestQueryDto,
} from '../../users/interfaces/model-interfaces';
import {
  RequestQueryComments,
  RequestQueryDto,
} from '../../api/filters/interfaces/query-filter-interfaces';
import { PostModelResponse, PostRequestQueryDto, PostsListResponse } from '../../posts/interfaces/model-interfaces';
import { CommentsListResponse } from '../../comments/interfaces/model-interfaces';
import { graphqlUsersResolvers } from './graphql-users-resolvers';

const { ForbiddenError } = require('apollo-server-express');

import GraphQlInputService = require('../../api/graph-ql/service/graph-ql-input-service');
import BlockchainApiFetchService = require('../../blockchain-nodes/service/blockchain-api-fetch-service');
import AuthService = require('../../auth/authService');
import OneUserInputProcessor = require('../../users/input-processor/one-user-input-processor');
import OrganizationsFetchService = require('../../organizations/service/organizations-fetch-service');
import PostsFetchService = require('../../posts/service/posts-fetch-service');
import TagsFetchService = require('../../tags/service/tags-fetch-service');
import CommentsFetchService = require('../../comments/service/comments-fetch-service');

const graphQLJSON = require('graphql-type-json');

export const resolvers = {
  JSON: graphQLJSON,

  Query: {
    ...graphqlUsersResolvers,

    async many_blockchain_nodes(
      // @ts-ignore
      parent,
      args,
    ) {
      const customQuery = {
        filters: {
          deleted_at: false,
        },
      };

      const query: RequestQueryBlockchainNodes = GraphQlInputService.getQueryFromArgs(args, customQuery);

      return BlockchainApiFetchService.getAndProcessNodes(query);
    },

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
    // @ts-ignore // @deprecated
    async organizations(parent, args, ctx): PostsListResponse {
      const query: RequestQueryDto = {
        page: args.page,
        per_page: args.per_page,
        sort_by: args.order_by,
        ...args.filters,
      };

      return OrganizationsFetchService.findAndProcessAll(query);
    },
    // @ts-ignore
    // eslint-disable-next-line sonarjs/no-identical-functions
    async many_organizations(parent, args, ctx): PostsListResponse {
      const query: RequestQueryDto = {
        page: args.page,
        per_page: args.per_page,
        sort_by: args.order_by,
        ...args.filters,
      };

      return OrganizationsFetchService.findAndProcessAll(query);
    },
    // @ts-ignore
    async many_tags(parent, args, ctx) {
      const query: RequestQueryDto = {
        page: args.page,
        per_page: args.per_page,
        sort_by: args.order_by,
        ...args.filters,
      };

      return TagsFetchService.findAndProcessManyTags(query);
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
    // @ts-ignore
    async one_post(parent, args, ctx): PostModelResponse {
      // MaintenanceHelper.hideAirdropsOfferIfRequired(ctx.req, args.id);

      const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

      const commentsQuery: RequestQueryComments = args.comments_query;
      commentsQuery.depth = 0;

      return PostsFetchService.findOnePostByIdAndProcessV2(args.id, currentUserId, commentsQuery);
    },
    // @ts-ignore
    async comments_on_comment(parent, args, ctx): CommentsListResponse {
      const commentsQuery: RequestQueryComments = {
        commentable_id: args.commentable_id,
        parent_id: args.parent_id,
        depth: args.parent_depth + 1,

        page: args.page,
        per_page: args.per_page,
      };

      const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);
      return CommentsFetchService.findAndProcessCommentsOfComment(commentsQuery, currentUserId);
    },
    // @ts-ignore
    async feed_comments(parent, args, ctx, info): CommentsListResponse {
      const commentsQuery = {
        depth: 0, // always for first level comments
        page: args.page,
        per_page: args.per_page,
      };

      const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

      return CommentsFetchService.findAndProcessCommentsByPostId(
        args.commentable_id,
        currentUserId,
        commentsQuery,
      );
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
  },
};
