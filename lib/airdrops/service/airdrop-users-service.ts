import { OneUserAirdropDto, OneUserAirdropFilter } from '../interfaces/dto-interfaces';
import { AppError, BadRequestError } from '../../api/errors';
import { CurrentUserDataDto, IdsFromTokensDto } from '../../auth/interfaces/auth-interfaces-dto';
import { ApiLogger } from '../../../config/winston';
import { IAirdrop } from '../interfaces/model-interfaces';

import AuthService = require('../../auth/authService');
import UsersExternalRepository = require('../../users-external/repository/users-external-repository');
import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import AirdropsFetchRepository = require('../repository/airdrops-fetch-repository');
import AirdropsUsersExternalDataService = require('./airdrops-users-external-data-service');
import AirdropUsersValidator = require('../validator/airdrop-users-validator');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

class AirdropUsersService {
  public static async getOneUserAirdrop(
    req: any,
    filters: OneUserAirdropFilter,
  ): Promise<OneUserAirdropDto> {
    const currentUserDto: CurrentUserDataDto = await this.getCurrentUserDto(req);

    const airdrop: IAirdrop = await AirdropsFetchRepository.getAirdropByPk(+filters.airdrop_id);

    if (!airdrop) {
      throw new BadRequestError(`There is no airdrop with ID: ${filters.airdrop_id}`, 404);
    }

    const airdropData = await this.getUserAirdropData(currentUserDto, airdrop);
    const conditions = await this.getConditions(currentUserDto, +airdrop.conditions.community_id_to_follow);

    return {
      airdrop_id: airdrop.id,
      user_id: currentUserDto.currentUser ? currentUserDto.currentUser.id : null,
      conditions,
      ...airdropData,
    };
  }

  private static async getCurrentUserDto(
    req: any,
  ): Promise<CurrentUserDataDto> {
    const idsFromTokens: IdsFromTokensDto = AuthService.getIdsFromAuthTokens(req);

    const res: CurrentUserDataDto = {
      currentUser: null,
      userExternal: null,
    };

    if (idsFromTokens.currentUserId) {
      res.currentUser = {
        id: idsFromTokens.currentUserId,
      };
    }

    if (idsFromTokens.usersExternalId) {
      const userExternal =
        await UsersExternalRepository.findGithubUserExternalByPkId(idsFromTokens.usersExternalId);

      if (!userExternal) {
        throw new BadRequestError(
          `Malformed userExternal ID inside token: ${idsFromTokens.usersExternalId}`,
          400,
        );
      }

      res.userExternal = {
        id: idsFromTokens.usersExternalId,
        external_id: userExternal.external_id,
      };
    }

    return res;
  }

  private static async getUserAirdropData(
    currentUserDto: CurrentUserDataDto,
    airdrop: IAirdrop,
  ) {
    const airdropState = await AirdropsFetchRepository.getAirdropStateById(airdrop.id);

    const userTokens: any[] = [];
    airdropState.tokens.forEach((item) => {
      userTokens.push({
        amount_claim: 0,
        symbol: item.symbol,
        precision: item.precision,
      });
    });

    const data = {
      score: 0,
      airdrop_status: AirdropStatuses.NEW,
      tokens: userTokens,
    };

    if (currentUserDto.currentUser === null && currentUserDto.userExternal === null) {
      return data;
    }

    if (currentUserDto.userExternal) {
      // If token exists then it is possible to fetch token distribution data
      const externalData =
        await AirdropsUsersExternalDataService.processForUsersExternalId(airdrop, currentUserDto.userExternal);

      this.processWithExternalData(data, externalData, userTokens, airdropState);
    } else if (currentUserDto.currentUser) {
      const externalData =
        await AirdropsUsersExternalDataService.processForCurrentUserId(airdrop, currentUserDto.currentUser);

      if (externalData) {
        this.processWithExternalData(data, externalData, userTokens, airdropState);
      }

      // else do nothing - zero tokens response
    } else {
      throw new AppError('Please check currentUsersDto conditions beforehand', 500);
    }

    return data;
  }

  private static processWithExternalData(data, externalData, userTokens, airdropState): void {
    AirdropUsersValidator.checkTokensConsistency(userTokens, externalData.tokens);

    for (const token of externalData.tokens) {
      if (externalData.score === 0 && token.amount_claim > 0) {
        ApiLogger.error('Consistency check is failed. If score is 0 then all amount_claim must be 0', {
          data,
          external_data: JSON.stringify(externalData),
          service: 'airdrops',
        });

        throw new AppError('Internal server error');
      }
    }

    data.score = externalData.score;
    data.tokens = externalData.tokens;
    data.airdrop_status = externalData.status;

    data.tokens.forEach((token) => {
      const stateToken = airdropState.tokens.find(airdropToken => airdropToken.symbol === token.symbol);

      token.amount_claim /= (10 ** stateToken.precision);
    });
  }


  private static async getConditions(
    currentUserDto: CurrentUserDataDto,
    orgIdToFollow: number,
  ) {
    const conditions = {
      auth_github: false,
      auth_myself: false,
      following_devExchange: false,
    };

    if (currentUserDto.currentUser) {
      conditions.auth_myself = true;
    }

    if (currentUserDto.userExternal) {
      conditions.auth_github = true;
    }

    if (currentUserDto.currentUser) {
      const userExternal = await UsersExternalRepository.findGithubUserExternalByUserId(currentUserDto.currentUser.id);
      conditions.auth_github = userExternal !== null;
    }

    if (currentUserDto.currentUser) {
      conditions.following_devExchange =
        await UsersActivityRepository.doesUserFollowOrg(currentUserDto.currentUser.id, orgIdToFollow);
    }

    return conditions;
  }
}

export = AirdropUsersService;
