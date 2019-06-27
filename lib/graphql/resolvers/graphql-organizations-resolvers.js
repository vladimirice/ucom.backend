"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OrganizationsFetchService = require("../../organizations/service/organizations-fetch-service");
const AuthService = require("../../auth/authService");
const UsersFetchService = require("../../users/service/users-fetch-service");
exports.graphqlOrganizationsResolvers = {
    async many_organizations(
    // @ts-ignore
    parent, args, 
    // @ts-ignore
    ctx) {
        const query = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
        return OrganizationsFetchService.findAndProcessAll(query);
    },
    async one_organization_activity(
    // @ts-ignore
    parent, args, ctx) {
        const usersQuery = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
        const currentUserId = AuthService.extractCurrentUserByToken(ctx.req);
        const organizationId = +args.filters.organization_identity;
        return UsersFetchService.findManyOrganizationFollowers(organizationId, usersQuery, currentUserId);
    },
    /**
     * @deprecated
     * @see many_organizations
     */
    // eslint-disable-next-line sonarjs/no-identical-functions
    async organizations(
    // @ts-ignore
    parent, args, 
    // @ts-ignore
    ctx) {
        const query = Object.assign({ page: args.page, per_page: args.per_page, sort_by: args.order_by }, args.filters);
        return OrganizationsFetchService.findAndProcessAll(query);
    },
};
