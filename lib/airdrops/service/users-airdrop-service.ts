import { OneUserAirdropDto, OneUserAirdropFilter } from '../interfaces/dto-interfaces';
import { HttpUnauthorizedError } from '../../api/errors';

import AuthService = require('../../auth/authService');

const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

class UsersAirdropService {
  public static async getOneUserAirdrop(
    req: any,
    filters: OneUserAirdropFilter,
  ): Promise<OneUserAirdropDto> {
    this.processAuthTokens(req);

    return {
      airdrop_id: filters.airdrop_id,
      user_id:  null, // null only if airdrop_status = new
      github_score: 550.044,
      airdrop_status: 1, // new
      conditions: {
        auth_github: true,
        auth_myself: false,
        following_devExchange: false,
      },
      tokens: [
        {
          amount_claim: 50025,
          symbol: 'UOS',
        },
        {
          amount_claim: 82678,
          symbol: 'FN',
        },
      ],
    };
  }

  private static processAuthTokens(req) {
    const githubToken = req.headers[CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB];
    const currentUserId: number | null = AuthService.extractCurrentUserByToken(req);

    if (!githubToken && !currentUserId) {
      throw new HttpUnauthorizedError('Github token should be provided via cookie');
    }

    // TODO - sample logic
    if (githubToken) {
      AuthService.extractUsersExternalIdByTokenOrError(githubToken);
    }
  }
}

export = UsersAirdropService;
