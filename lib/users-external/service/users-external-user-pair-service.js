"use strict";
const errors_1 = require("../../api/errors");
const AuthService = require("../../auth/authService");
const UsersExternalRepository = require("../repository/users-external-repository");
class UsersExternalUserPairService {
    static async pair(req) {
        const { currentUserId, usersExternalId } = this.getIdsFromTokens(req);
        const externalUser = await UsersExternalRepository.findExternalUserByPkId(usersExternalId);
        if (externalUser === null) {
            throw new errors_1.BadRequestError(`Token contains usersExternalId = ${usersExternalId} but there is no appropriate record in the database`);
        }
        if (externalUser.user_id !== null && externalUser.user_id === currentUserId) {
            return {
                status: 208,
                message: 'Current user is already paired with the provided GitHub identity.',
            };
        }
        if (externalUser.user_id !== null && externalUser.user_id !== currentUserId) {
            throw new errors_1.BadRequestError('This GitHub identity is already paired with a different user');
        }
        await UsersExternalRepository.setUserId(usersExternalId, currentUserId);
        return {
            status: 201,
            message: 'Current user is successfully paired with the provided GitHub token',
        };
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
