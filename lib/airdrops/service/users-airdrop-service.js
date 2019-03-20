"use strict";
const errors_1 = require("../../api/errors");
const AuthService = require("../../auth/authService");
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
class UsersAirdropService {
    static async getOneUserAirdrop(req, filters) {
        this.processAuthTokens(req);
        return {
            airdrop_id: filters.airdrop_id,
            user_id: null,
            github_score: 550.044,
            airdrop_status: 1,
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
    static processAuthTokens(req) {
        const githubToken = req.headers[CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB];
        const currentUserId = AuthService.extractCurrentUserByToken(req);
        if (!githubToken && !currentUserId) {
            throw new errors_1.HttpUnauthorizedError('Github token should be provided via cookie');
        }
        // TODO - sample logic
        if (githubToken) {
            AuthService.extractUsersExternalIdByTokenOrError(githubToken);
        }
    }
}
module.exports = UsersAirdropService;
