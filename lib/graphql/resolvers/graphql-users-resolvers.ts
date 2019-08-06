import { OneUserAirdropDto } from '../../airdrops/interfaces/dto-interfaces';
import {
  OneContentActivityUsersQueryDto,
  UserModel,
  UsersActivityQueryDto,
  UsersListResponse,
  UsersRequestQueryDto,
} from '../../users/interfaces/model-interfaces';
import { OrgListResponse } from '../../organizations/interfaces/model-interfaces';
import { InputQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';

import AirdropUsersService = require('../../airdrops/service/airdrop-users-service');
import OrganizationsFetchService = require('../../organizations/service/organizations-fetch-service');
import AuthService = require('../../auth/authService');
import OneUserInputProcessor = require('../../users/input-processor/one-user-input-processor');
import UsersFetchService = require('../../users/service/users-fetch-service');
import GraphQlInputService = require('../../api/graph-ql/service/graph-ql-input-service');

export const graphqlUsersResolvers = {
  async one_user_airdrop(
    // @ts-ignore
    parent,
    args,
    ctx,
  ): Promise<OneUserAirdropDto> {
    return AirdropUsersService.getOneUserAirdrop(ctx.req, args.filters);
  },
  // @ts-ignore
  async one_user(parent, args, ctx): Promise<UserModel> {
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);
    const userId: number = await OneUserInputProcessor.getUserIdByFilters(args.filters);

    return UsersFetchService.findOneAndProcessFully(userId, currentUserId);
  },
  /**
   * @deprecated
   * @see one_user_activity
   */
  async one_user_trusted_by(
    // @ts-ignore
    parent,
    args,
    ctx,
  ): Promise<UsersListResponse> {
    const usersQuery: UsersActivityQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,

      activity: 'trusted_by',
    };

    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    const userId: number = await OneUserInputProcessor.getUserIdByFilters(args.filters);

    return UsersFetchService.findOneUserActivity(userId, usersQuery, currentUserId);
  },

  async one_user_activity(
    // @ts-ignore
    parent,
    args,
    ctx,
  ): Promise<UsersListResponse> {
    const usersQuery: UsersActivityQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,
    };
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    const userId: number = await OneUserInputProcessor.getUserIdByFilters(args.filters);

    return UsersFetchService.findOneUserActivity(userId, usersQuery, currentUserId);
  },
  async one_content_voting_users(
    // @ts-ignore
    parent,
    args,
    ctx,
  ): Promise<UsersListResponse> {
    const usersQuery: OneContentActivityUsersQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,
    };
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    return UsersFetchService.findOneContentVotingUsers(usersQuery, currentUserId);
  },
  /**
   * @deprecated
   * @see one_user_activity
   */
  async one_user_referrals(
    // @ts-ignore
    parent,
    args,
    ctx,
  ): Promise<UsersListResponse> {
    const usersQuery: UsersActivityQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,
      activity: 'referrals',
    };

    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);
    const userId: number = await OneUserInputProcessor.getUserIdByFilters(args.filters);

    return UsersFetchService.findOneUserActivity(userId, usersQuery, currentUserId);
  },

  async one_user_follows_organizations(
    // @ts-ignore
    parent,
    args,
  ): Promise<OrgListResponse> {
    const query: InputQueryDto = GraphQlInputService.getQueryFromArgs(args);
    const userId: number = await OneUserInputProcessor.getUserIdByFilters(args.filters);

    return OrganizationsFetchService.findAllFollowedByUserAndProcess(userId, query);
  },

  async many_users(
    // @ts-ignore
    parent,
    args,
    ctx,
  ): Promise<UsersListResponse> {
    const usersQuery: UsersRequestQueryDto = {
      page: args.page,
      per_page: args.per_page,
      sort_by: args.order_by,
      ...args.filters,
    };

    const currentUserId: number | null = AuthService.extractCurrentUserByToken(ctx.req);

    if (usersQuery.airdrops) {
      return UsersFetchService.findAllAirdropParticipants(usersQuery, currentUserId);
    }

    return UsersFetchService.findAllAndProcessForList(usersQuery, currentUserId);
  },
};
