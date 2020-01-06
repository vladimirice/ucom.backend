"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropUsersService = require("../../airdrops/service/airdrop-users-service");
const OrganizationsFetchService = require("../../organizations/service/organizations-fetch-service");
const AuthService = require("../../auth/authService");
const OneUserInputProcessor = require("../../users/input-processor/one-user-input-processor");
const UsersFetchService = require("../../users/service/users-fetch-service");
const GraphQlInputService = require("../../api/graph-ql/service/graph-ql-input-service");
const ApiPostEvents = require("../../common/service/api-post-events");
exports.graphqlUsersResolvers = {
    async one_user_airdrop(
    // @ts-ignore
    parent, args, ctx) {
        return AirdropUsersService.getOneUserAirdrop(ctx.req, args.filters);
    },
    async one_user(
    // @ts-ignore
    parent, args, ctx) {
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        const userId = await OneUserInputProcessor.getUserIdByFilters(args.filters);
        const user = await UsersFetchService.findOneAndProcessFully(userId, currentUserId);
        await ApiPostEvents.processForUserProfileAndChangeProps(currentUserId, user, ctx.req);
        return user;
    },
    /**
     * @deprecated
     * @see one_user_activity
     */
    async one_user_trusted_by(
    // @ts-ignore
    parent, args, ctx) {
        const usersQuery = Object.assign(Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters), { activity: 'trusted_by' });
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        const userId = await OneUserInputProcessor.getUserIdByFilters(args.filters);
        return UsersFetchService.findOneUserActivity(userId, usersQuery, currentUserId);
    },
    async one_user_activity(
    // @ts-ignore
    parent, args, ctx) {
        const usersQuery = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        const userId = await OneUserInputProcessor.getUserIdByFilters(args.filters);
        return UsersFetchService.findOneUserActivity(userId, usersQuery, currentUserId);
    },
    async one_content_voting_users(
    // @ts-ignore
    parent, args, ctx) {
        const usersQuery = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        return UsersFetchService.findOneContentVotingUsers(usersQuery, currentUserId);
    },
    /**
     * @deprecated
     * @see one_user_activity
     */
    async one_user_referrals(
    // @ts-ignore
    parent, args, ctx) {
        const usersQuery = Object.assign(Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters), { activity: 'referrals' });
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        const userId = await OneUserInputProcessor.getUserIdByFilters(args.filters);
        return UsersFetchService.findOneUserActivity(userId, usersQuery, currentUserId);
    },
    async one_user_follows_organizations(
    // @ts-ignore
    parent, args) {
        const query = GraphQlInputService.getQueryFromArgs(args);
        const userId = await OneUserInputProcessor.getUserIdByFilters(args.filters);
        return OrganizationsFetchService.findAllFollowedByUserAndProcess(userId, query);
    },
    async many_users(
    // @ts-ignore
    parent, args, ctx) {
        const usersQuery = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        if (usersQuery.airdrops) {
            return UsersFetchService.findAllAirdropParticipants(usersQuery, currentUserId);
        }
        return UsersFetchService.findAllAndProcessForList(usersQuery, currentUserId);
    },
};
