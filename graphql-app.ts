import { GraphQLError } from 'graphql';
import { RequestQueryComments, RequestQueryDto } from './lib/api/filters/interfaces/query-filter-interfaces';
import { PostModelResponse, PostRequestQueryDto, PostsListResponse } from './lib/posts/interfaces/model-interfaces';
import { CommentsListResponse } from './lib/comments/interfaces/model-interfaces';

import PostsFetchService = require('./lib/posts/service/posts-fetch-service');
import AuthService = require('./lib/auth/authService');
import CommentsFetchService = require('./lib/comments/service/comments-fetch-service');
import OrganizationsFetchService = require('./lib/organizations/service/organizations-fetch-service');
import TagsFetchService = require('./lib/tags/service/tags-fetch-service');

const express = require('express');

const {
  ApolloServer, gql, AuthenticationError, ForbiddenError,
} = require('apollo-server-express');

const graphQLJSON = require('graphql-type-json');
const { ApiLogger } = require('./config/winston');

// #task - generate field list from model and represent as object, not string
const typeDefs = gql`
  type Query {
    user_wall_feed(user_id: Int!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    org_wall_feed(organization_id: Int!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    tag_wall_feed(tag_identity: String!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    
    posts(filters: post_filtering, order_by: String!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    organizations(order_by: String!, page: Int!, per_page: Int!): organizations!
    many_tags(order_by: String!, page: Int!, per_page: Int!): tags!

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
    
    organization: Organization
    
    created_at: String!
    updated_at: String!

    entity_id_for: Int
    entity_name_for: String
    entity_for_card: JSON

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
    organization: Organization

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

  type organizations {
    data: [Organization!]!
    metadata: metadata!
  }

  type tags {
    data: [Tag!]!
    metadata: metadata!
  }
  
  type Organization {
    id: Int!
    title: String!
    avatar_filename: String
    nickname: String!
    current_rate: Float!
    user_id: Int!
  }
  
  type Tag {
    id: Int!
    title: String!
    current_rate: Float!
    current_posts_amount: Int!
    first_entity_id: Int!
    
    entity_name: String!
    
    created_at: String!
    updated_at: String!
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

  input post_filtering {
    post_type_id: Int!
    created_at: String
  }
`;

const resolvers = {
  JSON: graphQLJSON,

  Query: {
    // @ts-ignore
    async posts(parent, args, ctx): PostsListResponse {
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
    async organizations(parent, args, ctx): PostsListResponse {
      const query: RequestQueryDto = {
        page: args.page,
        per_page: args.per_page,
        sort_by: args.order_by,
      };

      return OrganizationsFetchService.findAndProcessAll(query);
    },
    // @ts-ignore
    async many_tags(parent, args, ctx) {
      const query: RequestQueryDto = {
        page: args.page,
        per_page: args.per_page,
        sort_by: args.order_by,
      };

      return TagsFetchService.findAndProcessManyTags(query);
    },
    // @ts-ignore
    async one_post(parent, args, ctx): PostModelResponse {
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

      return PostsFetchService.findAndProcessAllForUserWallFeed(
        args.user_id,
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

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: false,
  context: ({ req }) => ({ req }),
  formatError: (error: GraphQLError) => {
    const { originalError } = error;

    const toLog = {
      message: error.message,
      graphqlError: error,
      source: error.source,
      originalError,
    };

    if (originalError && originalError.name === 'JsonWebTokenError') {
      error = new AuthenticationError('Invalid token', 401);
    } else if (!originalError
      // @ts-ignore
      || (originalError.status && originalError.status === 500)
      || originalError instanceof Error) {
      ApiLogger.error(toLog);

      error.message = 'Internal server error';
    } else {
      ApiLogger.warn(toLog);
    }

    if (error.extensions) {
      delete error.extensions.exception;
    }

    return error;
  },
});

server.applyMiddleware({ app });

export = {
  app,
  server,
};
