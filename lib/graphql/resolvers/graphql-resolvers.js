"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_users_resolvers_1 = require("./graphql-users-resolvers");
const graphql_posts_resolvers_1 = require("./graphql-posts-resolvers");
const graphql_organizations_resolvers_1 = require("./graphql-organizations-resolvers");
const GraphQlInputService = require("../../api/graph-ql/service/graph-ql-input-service");
const BlockchainApiFetchService = require("../../blockchain-nodes/service/blockchain-api-fetch-service");
const AuthService = require("../../auth/authService");
const TagsFetchService = require("../../tags/service/tags-fetch-service");
const CommentsFetchService = require("../../comments/service/comments-fetch-service");
const graphQLJSON = require('graphql-type-json');
exports.resolvers = {
    JSON: graphQLJSON,
    Query: Object.assign({}, graphql_users_resolvers_1.graphqlUsersResolvers, graphql_posts_resolvers_1.graphqlPostsResolvers, graphql_organizations_resolvers_1.graphqlOrganizationsResolvers, { async many_blockchain_nodes(
        // @ts-ignore
        parent, args) {
            const customQuery = {
                filters: {
                    deleted_at: false,
                },
            };
            const query = GraphQlInputService.getQueryFromArgs(args, customQuery);
            return BlockchainApiFetchService.getAndProcessNodes(query);
        },
        async many_tags(
        // @ts-ignore
        parent, args, 
        // @ts-ignore
        ctx) {
            const query = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
            return TagsFetchService.findAndProcessManyTags(query);
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
        } }),
};
