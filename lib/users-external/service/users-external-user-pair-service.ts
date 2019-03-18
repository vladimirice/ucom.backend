import AuthService = require('../../auth/authService');

class UsersExternalUserPairService {
  public static async pair(req) {
    this.getIdsFromTokens(req);
  }

  private static getIdsFromTokens(req) {
    const currentUserId: number = AuthService.extractCurrentUserIdFromReqOrError(req);
    const usersExternalId: number = AuthService.extractUsersExternalIdFromGithubAuthTokenOrError(req);

    return {
      currentUserId,
      usersExternalId,
    };
  }
}

export = UsersExternalUserPairService;
