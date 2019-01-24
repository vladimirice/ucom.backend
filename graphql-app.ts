import { RequestQueryComments, RequestQueryDto } from './lib/api/filters/interfaces/query-filter-interfaces';
import { AppError } from './lib/api/errors';

import PostsFetchService = require('./lib/posts/service/posts-fetch-service');

const express = require('express');

// const {
//   parseResolveInfo,
// } = require('graphql-parse-resolve-info');

const { ApolloServer, gql } = require('apollo-server-express');

const graphQLJSON = require('graphql-type-json');
const { ApiLogger } = require('./config/winston');
const postsFetchService = require('./lib/posts/service/posts-fetch-service');
const commentsFetchService = require('./lib/comments/service/comments-fetch-service');

const authService = require('./lib/auth/authService');

// #task - generate field list from model and represent as object, not string
const typeDefs = gql`
  type Query {
    user_wall_feed(user_id: Int!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    user_news_feed(page: Int!, per_page: Int!, comments_query: comments_query!): posts!

    feed_comments(commentable_id: Int!, page: Int!, per_page: Int!): comments!
    comments_on_comment(commentable_id: Int!, parent_id: Int!, parent_depth: Int!, page: Int!, per_page: Int!): comments!
    one_post(id: Int!, comments_query: comments_query!): Post
  }

  scalar JSON

  type Post {
    id: Int!
    title: String
    description: String
    leading_text: String

    current_vote: Float!
    current_rate: Float!
    comments_count: Int!

    main_image_filename: String
    entity_images: JSON
    
    entity_tags: JSON

    user_id: Int!
    post_type_id: Int!
    blockchain_id: String!
    organization_id: Int
    created_at: String!
    updated_at: String!

    entity_id_for: Int
    entity_name_for: String

    User: User!

    myselfData: MyselfData

    comments: comments
    
    post: Post
  }

  type User {
    id: Int!
    account_name: String!
    first_name: String
    last_name: String
    nickname: String
    avatar_filename: String
    current_rate: Float!
    
    I_follow: JSON, 
    followed_by: JSON,
    myselfData: MyselfData,
  }

  type Comment {
    id: Int!,
    description: String!
    current_vote: Float!

    User: User!
    blockchain_id: String!
    commentable_id: Int!
    created_at: String!

    activity_user_comment: JSON
    organization: JSON

    depth: Int!
    myselfData: MyselfData
    organization_id: Int
    parent_id: Int
    path: JSON
    updated_at: String!
    user_id: Int!

    metadata: comment_metadata!
  }

  type posts {
    data: [Post!]!
    metadata: metadata!
  }

  type comments {
    data: [Comment!]!
    metadata: metadata!
  }

  type MyselfData {
    myselfVote: String
    join: Boolean
    organization_member: Boolean
    repost_available: Boolean

    follow: Boolean
    myFollower: Boolean

    editable: Boolean
    member:   Boolean
  }

  type metadata {
    page: Int!,
    per_page: Int!,
    has_more: Boolean!
    total_amount: Int!
  }

  type comment_metadata {
    next_depth_total_amount: Int!
  }
  
  input comments_query {
    page: Int!
    per_page: Int!
  }
`;

const resolvers = {
  JSON: graphQLJSON,

  Query: {
    // @ts-ignore
    async one_post(parent, args, ctx) {
      const currentUserId: number = authService.extractCurrentUserByToken(ctx.req);

      const commentsQuery: RequestQueryComments = args.comments_query;
      commentsQuery.depth = 0;

      return PostsFetchService.findOnePostByIdAndProcessV2(args.id, currentUserId, commentsQuery);
    },
    // @ts-ignore
    async comments_on_comment(parent, args, ctx) {
      const commentsQuery: RequestQueryComments = {
        commentable_id: args.commentable_id,
        parent_id: args.parent_id,
        depth: args.parent_depth + 1,

        page: args.page,
        per_page: args.per_page,
      };

      let res;
      try {
        const currentUserId: number = authService.extractCurrentUserByToken(ctx.req);
        res = await commentsFetchService.findAndProcessCommentsOfComment(
          commentsQuery,
          currentUserId,
        );
      } catch (err) {
        ApiLogger.error(err);

        throw new AppError('Internal server error', 500);
      }

      return res;
    },

    // @ts-ignore
    async feed_comments(parent, args, ctx, info) {
      const commentsQuery = {
        depth: 0, // always for first level comments
        page: args.page,
        per_page: args.per_page,
      };

      const currentUserId: number = authService.extractCurrentUserByToken(ctx.req);

      return commentsFetchService.findAndProcessCommentsByPostId(
        args.commentable_id,
        currentUserId,
        commentsQuery,
      );
    },
    async user_wall_feed(
      // @ts-ignore
      parent,
      // @ts-ignore
      args,
      // @ts-ignoreuser_wall_feed
      ctx,
      // @ts-ignore
      info,
    ) {
      const currentUserId: number = authService.extractCurrentUserByToken(ctx.req);

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

      // const parsedResolveInfoFragment = parseResolveInfo(info);
      // @ts-ignore
      // const commentsArgs =
      // parsedResolveInfoFragment.fieldsByTypeName.posts.data.fieldsByTypeName.Post.comments.args;

      let res;
      try {
        res = await postsFetchService.findAndProcessAllForUserWallFeed(
          args.user_id,
          currentUserId,
          postsQuery,
        );
      } catch (err) {
        ApiLogger.error(err);

        throw new AppError('Internal server error', 500);
      }

      return res;
    },

    async user_news_feed(
      // @ts-ignore
      parent,
      // @ts-ignore
      args,
      // @ts-ignoreuser_wall_feed
      ctx,
      // @ts-ignore
      info,
    ) {
      const currentUserId: number = authService.extractCurrentUserByToken(ctx.req);

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

      // const parsedResolveInfoFragment = parseResolveInfo(info);
      // @ts-ignore
      // const commentsArgs =
      // parsedResolveInfoFragment.fieldsByTypeName.posts.data.fieldsByTypeName.Post.comments.args;

      let res;
      try {
        res = await postsFetchService.findAndProcessAllForMyselfNewsFeed(
          postsQuery,
          currentUserId,
        );
      } catch (err) {
        ApiLogger.error(err);

        throw new AppError('Internal server error', 500);
      }

      return res;
    },
  },
};


const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: false,
  context: ({ req }) => ({ req }),
});

server.applyMiddleware({ app });

export = {
  app,
  server,
};
