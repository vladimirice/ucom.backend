import { BadRequestError } from '../../api/errors';
import { UserExternalModel } from '../interfaces/model-interfaces';

import AuthService = require('../../auth/authService');
import UsersExternalRepository = require('../repository/users-external-repository');

class UsersExternalUserPairService {
  public static async pair(req) {
    const { currentUserId, usersExternalId } = this.getIdsFromTokens(req);
    const externalUser: UserExternalModel | null =
      await UsersExternalRepository.findExternalUserByPkId(usersExternalId);

    if (externalUser === null) {
      throw new BadRequestError(
        `Token contains usersExternalId = ${usersExternalId} but there is no appropriate record in the database`,
      );
    }

    if (externalUser.user_id !== null && externalUser.user_id === currentUserId) {
      return {
        status: 208,
        message: 'Current user is already paired with the provided GitHub identity.',
      };
    }

    if (externalUser.user_id !== null && externalUser.user_id !== currentUserId) {
      throw new BadRequestError(
        'This GitHub identity is already paired with a different user',
      );
    }

    await UsersExternalRepository.setUserId(usersExternalId, currentUserId);

    return {
      status: 201,
      message: 'Current user is successfully paired with the provided GitHub token',
    };
  }

  private static getIdsFromTokens(req): { currentUserId: number, usersExternalId: number } {
    const currentUserId: number   = AuthService.extractCurrentUserIdFromReqOrError(req);
    const usersExternalId: number = AuthService.extractUsersExternalIdFromGithubAuthTokenOrError(req);

    return {
      currentUserId,
      usersExternalId,
    };
  }
}

export = UsersExternalUserPairService;
