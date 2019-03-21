import { OneUserAirdropDto, OneUserAirdropFilter } from '../interfaces/dto-interfaces';

import AuthService = require('../../auth/authService');
import UsersExternalRepository = require('../../users-external/repository/users-external-repository');
import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import AirdropsFetchRepository = require('../repository/airdrops-fetch-repository');
import { BadRequestError } from '../../api/errors';

class AirdropUsersService {
  public static async getOneUserAirdrop(
    req: any,
    filters: OneUserAirdropFilter,
  ): Promise<OneUserAirdropDto> {
    const idsFromTokens = AuthService.getIdsFromAuthTokens(req);

    const airdrop = await AirdropsFetchRepository.getAirdropByPk(filters.airdrop_id);

    if (!airdrop) {
      throw new BadRequestError(`There is no airdrop with ID: ${filters.airdrop_id}`, 404);
    }

    const airdropData = await this.getUserAirdropData(idsFromTokens);
    const conditions = await this.getConditions(idsFromTokens, +airdrop.conditions.community_id_to_follow);

    return {
      airdrop_id: filters.airdrop_id,
      user_id: idsFromTokens.currentUserId,
      conditions,
      ...airdropData,
    };
  }

  // TODO - fetch from user airdrops
  private static async getUserAirdropData(idsFromTokens) {
    const data = {
      score: 0,
      airdrop_status: 1,
      tokens: [
        {
          amount_claim: 0,
          symbol: 'UOSTEST',
        },
        {
          amount_claim: 0,
          symbol: 'GHTEST',
        },
      ],
    };

    if (idsFromTokens.currentUserId === null && idsFromTokens.usersExternalId === null) {
      return data;
    }

    data.score = 550.044;
    data.tokens[0].amount_claim = 50025;
    data.tokens[1].amount_claim = 82678;

    return data;
  }

  private static async getConditions(idsFromTokens, orgIdToFollow: number) {
    const conditions = {
      auth_github: false,
      auth_myself: false,
      following_devExchange: false,
    };

    if (idsFromTokens.currentUserId) {
      conditions.auth_myself = true;
    }

    if (idsFromTokens.usersExternalId) {
      conditions.auth_github = true;

      if (idsFromTokens.currentUserId) {
        const userExternal = await UsersExternalRepository.findGithubUserExternalByUserId(idsFromTokens.currentUserId);
        conditions.auth_github = userExternal !== null;
      }
    }

    if (idsFromTokens.currentUserId) {
      conditions.following_devExchange =
        await UsersActivityRepository.doesUserFollowOrg(idsFromTokens.currentUserId, orgIdToFollow);
    }

    return conditions;
  }
}

export = AirdropUsersService;
