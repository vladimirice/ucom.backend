"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PostsFetchService = require("./lib/posts/service/posts-fetch-service");
const AuthService = require("./lib/auth/authService");
const CommentsFetchService = require("./lib/comments/service/comments-fetch-service");
const OrganizationsFetchService = require("./lib/organizations/service/organizations-fetch-service");
const TagsFetchService = require("./lib/tags/service/tags-fetch-service");
const UsersFetchService = require("./lib/users/service/users-fetch-service");
const express = require('express');
const { ApolloServer, gql, AuthenticationError, ForbiddenError, } = require('apollo-server-express');
const graphQLJSON = require('graphql-type-json');
const { ApiLogger } = require('./config/winston');
// #task - generate field list from model and represent as object, not string
const typeDefs = gql `
  type Query {
    user_wall_feed(user_id: Int!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    org_wall_feed(organization_id: Int!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    tag_wall_feed(tag_identity: String!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    
    posts(filters: post_filtering, order_by: String!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    many_posts(filters: post_filtering, order_by: String!, page: Int!, per_page: Int!, comments_query: comments_query!): posts!
    many_users(filters: users_filtering, order_by: String!, page: Int!, per_page: Int!): users!
    
    organizations(filters: org_filtering, order_by: String!, page: Int!, per_page: Int!): organizations!
    many_organizations(filters: org_filtering, order_by: String!, page: Int!, per_page: Int!): organizations!
    many_tags(filters: tag_filtering, order_by: String!, page: Int!, per_page: Int!): tags!

    user_news_feed(page: Int!, per_page: Int!, comments_query: comments_query!): posts!

    feed_comments(commentable_id: Int!, page: Int!, per_page: Int!): comments!
    comments_on_comment(commentable_id: Int!, parent_id: Int!, parent_depth: Int!, page: Int!, per_page: Int!): comments!
    one_post(id: Int!, comments_query: comments_query!): Post
    
    many_blockchain_nodes(order_by: String!, page: Int!, per_page: Int!): JSON
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
  
  type users {
    data: [User!]!
    metadata: metadata!
  }
  
  type Organization {
    id: Int!
    title: String!
    avatar_filename: String
    nickname: String!
    current_rate: Float!
    user_id: Int!
    about: String
    powered_by: String
  }
  
  type Tag {
    id: Int!
    title: String!
    current_rate: Float!
    current_posts_amount: Int!
    current_media_posts_amount: Int!
    current_direct_posts_amount: Int!

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
    overview_type: String
    post_type_id: Int!
    created_at: String
  }
  
  input org_filtering {
    overview_type: String
    entity_name: String
    post_type_id: Int
  }
  
  input tag_filtering {
    overview_type: String
    entity_name: String
    post_type_id: Int
  }

  input users_filtering {
    overview_type: String
    entity_name: String
    post_type_id: Int
  }
`;
// @ts-ignore
const resolvers = {
    JSON: graphQLJSON,
    Query: {
        // @ts-ignore
        async many_blockchain_nodes(parent, args, ctx) {
            const bpNodes = [];
            const calcNodes = [];
            for (let i = 1; i <= 12; i += 1) {
                bpNodes.push({
                    id: i,
                    title: `bp_node_${i}`,
                    votes_count: i * 5,
                    votes_amount: i * 10003509,
                    currency: 'UOS',
                    bp_status: i % 2 === 0 ? 1 : 2,
                    blockchain_nodes_type: 1,
                    myselfData: {
                        bp_vote: i % 2 === 0,
                    },
                    votes_percentage: 23.81 + i * 4,
                });
            }
            for (let i = 13; i <= 21; i += 1) {
                calcNodes.push({
                    id: i,
                    title: `calc_node_${i}`,
                    votes_count: i * 5,
                    votes_amount: i * 10003509,
                    currency: 'importance',
                    bp_status: i % 2 === 0 ? 1 : 2,
                    blockchain_nodes_type: 2,
                    myselfData: {
                        bp_vote: i % 2 === 0,
                    },
                    votes_percentage: 23.81 + i * 2,
                });
            }
            return {
                1: {
                    data: bpNodes,
                    metadata: {
                        has_more: true,
                        page: +args.page,
                        per_page: args.per_page,
                        total_amount: 12,
                    },
                },
                2: {
                    data: calcNodes,
                    metadata: {
                        has_more: false,
                        page: +args.page,
                        per_page: args.per_page,
                        total_amount: 8,
                    },
                },
            };
        },
        // @ts-ignore
        async many_users(parent, args, ctx) {
            const postsQuery = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            return UsersFetchService.findAllAndProcessForList(postsQuery, currentUserId);
        },
        // @ts-ignore
        async many_posts(parent, args, ctx) {
            const postsQuery = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters, { include: [
                    'comments',
                ], included_query: {
                    comments: args.comments_query,
                } });
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            return PostsFetchService.findManyPosts(postsQuery, currentUserId);
        },
        /**
         * @deprecated
         */
        // @ts-ignore
        // eslint-disable-next-line sonarjs/no-identical-functions
        async posts(parent, args, ctx) {
            const postsQuery = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters, { include: [
                    'comments',
                ], included_query: {
                    comments: args.comments_query,
                } });
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            return PostsFetchService.findManyPosts(postsQuery, currentUserId);
        },
        // @ts-ignore // @deprecated
        async organizations(parent, args, ctx) {
            const query = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
            return OrganizationsFetchService.findAndProcessAll(query);
        },
        // @ts-ignore
        // eslint-disable-next-line sonarjs/no-identical-functions
        async many_organizations(parent, args, ctx) {
            const query = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
            return OrganizationsFetchService.findAndProcessAll(query);
        },
        // @ts-ignore
        async many_tags(parent, args, ctx) {
            const query = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
            return TagsFetchService.findAndProcessManyTags(query);
        },
        // @ts-ignore
        async one_post(parent, args, ctx) {
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            const commentsQuery = args.comments_query;
            commentsQuery.depth = 0;
            return PostsFetchService.findOnePostByIdAndProcessV2(args.id, currentUserId, commentsQuery);
        },
        // @ts-ignore
        async comments_on_comment(parent, args, ctx) {
            const commentsQuery = {
                commentable_id: args.commentable_id,
                parent_id: args.parent_id,
                depth: args.parent_depth + 1,
                page: args.page,
                per_page: args.per_page,
            };
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            return CommentsFetchService.findAndProcessCommentsOfComment(commentsQuery, currentUserId);
        },
        // @ts-ignore
        async feed_comments(parent, args, ctx, info) {
            const commentsQuery = {
                depth: 0,
                page: args.page,
                per_page: args.per_page,
            };
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            return CommentsFetchService.findAndProcessCommentsByPostId(args.commentable_id, currentUserId, commentsQuery);
        },
        // @ts-ignore
        async user_wall_feed(parent, args, ctx, info) {
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            const postsQuery = {
                page: args.page,
                per_page: args.per_page,
                include: [
                    'comments',
                ],
                included_query: {
                    comments: args.comments_query,
                },
            };
            return PostsFetchService.findAndProcessAllForUserWallFeed(args.user_id, currentUserId, postsQuery);
        },
        // @ts-ignore
        async org_wall_feed(parent, args, ctx, info) {
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            const postsQuery = {
                page: args.page,
                per_page: args.per_page,
                include: [
                    'comments',
                ],
                included_query: {
                    comments: args.comments_query,
                },
            };
            return PostsFetchService.findAndProcessAllForOrgWallFeed(args.organization_id, currentUserId, postsQuery);
        },
        // @ts-ignore
        async tag_wall_feed(parent, args, ctx, info) {
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            const postsQuery = {
                page: args.page,
                per_page: args.per_page,
                include: [
                    'comments',
                ],
                included_query: {
                    comments: args.comments_query,
                },
            };
            const tagIdentity = args.tag_identity;
            return PostsFetchService.findAndProcessAllForTagWallFeed(tagIdentity, currentUserId, postsQuery);
        },
        // @ts-ignore
        async user_news_feed(parent, args, ctx, info) {
            const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
            if (!currentUserId) {
                throw new ForbiddenError('Auth token is required', 403);
            }
            const postsQuery = {
                page: args.page,
                per_page: args.per_page,
                include: [
                    'comments',
                ],
                included_query: {
                    comments: args.comments_query,
                },
            };
            return PostsFetchService.findAndProcessAllForMyselfNewsFeed(postsQuery, currentUserId);
        },
    },
};
const app = express();
exports.app = app;
const server = new ApolloServer({
    typeDefs,
    resolvers,
    cors: false,
    context: ({ req }) => ({ req }),
    formatError: (error) => {
        const { originalError } = error;
        const toLog = {
            message: error.message,
            graphqlError: error,
            source: error.source,
            originalError,
        };
        if (originalError && originalError.name === 'JsonWebTokenError') {
            error = new AuthenticationError('Invalid token', 401);
        }
        else if (!originalError
            // @ts-ignore
            || (originalError.status && originalError.status === 500)
            || originalError instanceof Error) {
            ApiLogger.error(toLog);
            error.message = 'Internal server error';
        }
        else {
            ApiLogger.warn(toLog);
        }
        if (error.extensions) {
            delete error.extensions.exception;
        }
        return error;
    },
});
exports.server = server;
server.applyMiddleware({ app });
