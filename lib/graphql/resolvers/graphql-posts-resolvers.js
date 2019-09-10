"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { ForbiddenError } = require('apollo-server-express');
const AuthService = require("../../auth/authService");
const OneUserInputProcessor = require("../../users/input-processor/one-user-input-processor");
const PostsFetchService = require("../../posts/service/posts-fetch-service");
const ApiPostEvents = require("../../common/service/api-post-events");
exports.graphqlPostsResolvers = {
    // @ts-ignore
    async many_posts(parent, args, ctx) {
        const postsQuery = Object.assign(Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters), { include: [
                'comments',
            ], included_query: {
                comments: args.comments_query,
            } });
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        return PostsFetchService.findManyPosts(postsQuery, currentUserId);
    },
    // @ts-ignore
    async posts_feed(parent, args, ctx) {
        const postsQuery = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
        if (args.include) {
            // @ts-ignore - it is read only
            postsQuery.included_query = args.include;
        }
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        return PostsFetchService.findManyPosts(postsQuery, currentUserId);
    },
    /**
       * @deprecated
       */
    // @ts-ignore
    // eslint-disable-next-line sonarjs/no-identical-functions
    async posts(parent, args, ctx) {
        const postsQuery = Object.assign(Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters), { include: [
                'comments',
            ], included_query: {
                comments: args.comments_query,
            } });
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        return PostsFetchService.findManyPosts(postsQuery, currentUserId);
    },
    // @ts-ignore
    async one_post_offer(parent, args, ctx) {
        // MaintenanceHelper.hideAirdropsOfferIfRequired(ctx.req, args.id);
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        const commentsQuery = args.comments_query;
        commentsQuery.depth = 0;
        const usersTeamQuery = Object.assign({ page: args.users_team_query.page, per_page: args.users_team_query.per_page, sort_by: args.users_team_query.order_by }, args.users_team_query.filters);
        return PostsFetchService.findOnePostOfferWithAirdrop(args.id, currentUserId, commentsQuery, usersTeamQuery);
    },
    async one_post(
    // @ts-ignore
    parent, args, ctx) {
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        const commentsQuery = args.comments_query;
        commentsQuery.depth = 0;
        const postId = args.id;
        const post = await PostsFetchService.findOnePostByIdAndProcessV2(postId, currentUserId, commentsQuery);
        await ApiPostEvents.processForPostAndChangeProps(currentUserId, post, ctx.req);
        return post;
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
        let userId = args.user_id;
        if (args.filters) {
            userId = await OneUserInputProcessor.getUserIdByFilters(args.filters);
        }
        return PostsFetchService.findAndProcessAllForUserWallFeed(userId, currentUserId, postsQuery);
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
};
