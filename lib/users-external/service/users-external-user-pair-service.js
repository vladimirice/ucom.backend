"use strict";
const AuthService = require("../../auth/authService");
class UsersExternalUserPairService {
    static async pair(req) {
        this.getIdsFromTokens(req);
    }
    static getIdsFromTokens(req) {
        const currentUserId = AuthService.extractCurrentUserIdFromReqOrError(req);
        const usersExternalId = AuthService.extractUsersExternalIdFromGithubAuthTokenOrError(req);
        return {
            currentUserId,
            usersExternalId,
        };
    }
}
module.exports = UsersExternalUserPairService;
