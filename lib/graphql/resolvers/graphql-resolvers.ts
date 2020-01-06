import { RequestQueryBlockchainNodes } from '../../blockchain-nodes/interfaces/blockchain-nodes-interfaces';
import {
  RequestQueryComments,
  RequestQueryDto,
} from '../../api/filters/interfaces/query-filter-interfaces';
import { CommentsListResponse } from '../../comments/interfaces/model-interfaces';
import { graphqlUsersResolvers } from './graphql-users-resolvers';
import { graphqlPostsResolvers } from './graphql-posts-resolvers';
import { graphqlOrganizationsResolvers } from './graphql-organizations-resolvers';

import GraphQlInputService = require('../../api/graph-ql/service/graph-ql-input-service');
import BlockchainApiFetchService = require('../../blockchain-nodes/service/blockchain-api-fetch-service');
import AuthService = require('../../auth/authService');
import TagsFetchService = require('../../tags/service/tags-fetch-service');
import CommentsFetchService = require('../../comments/service/comments-fetch-service');

const graphQLJSON = require('graphql-type-json');

export const resolvers = {
  JSON: graphQLJSON,

  Query: {
    ...graphqlUsersResolvers,
    ...graphqlPostsResolvers,
    ...graphqlOrganizationsResolvers,

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

    async many_tags(
      // @ts-ignore
      parent,
      args,
      // @ts-ignore
      ctx,
    ) {
      const query: RequestQueryDto = {
        page: args.page,
        per_page: args.per_page,
        sort_by: args.order_by,
        ...args.filters,
      };

      return TagsFetchService.findAndProcessManyTags(query);
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
  },
};
