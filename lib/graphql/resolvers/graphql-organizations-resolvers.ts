import { RequestQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';
import { OrganizationsActivityQueryDto, UsersListResponse } from '../../users/interfaces/model-interfaces';

import OrganizationsFetchService = require('../../organizations/service/organizations-fetch-service');

import AuthService = require('../../auth/authService');
import UsersFetchService = require('../../users/service/users-fetch-service');

export const graphqlOrganizationsResolvers = {
  async many_organizations(
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

    return OrganizationsFetchService.findAndProcessAll(query);
  },

  async one_organization_activity(
    // @ts-ignore
    parent,
    args,
    ctx,
  ): Promise<UsersListResponse> {
    const usersQuery: OrganizationsActivityQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,
    };

    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);
    const organizationId: number = +args.filters.organization_identity;

    return UsersFetchService.findManyOrganizationFollowers(organizationId, usersQuery, currentUserId);
  },
  /**
   * @deprecated
   * @see many_organizations
   */
  // eslint-disable-next-line sonarjs/no-identical-functions
  async organizations(
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

    return OrganizationsFetchService.findAndProcessAll(query);
  },
};
