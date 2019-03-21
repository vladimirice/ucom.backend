"use strict";
const AuthService = require("../../auth/authService");
const UsersExternalRepository = require("../../users-external/repository/users-external-repository");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const AirdropsFetchRepository = require("../repository/airdrops-fetch-repository");
const errors_1 = require("../../api/errors");
class AirdropUsersService {
    static async getOneUserAirdrop(req, filters) {
        const idsFromTokens = AuthService.getIdsFromAuthTokens(req);
        const airdrop = await AirdropsFetchRepository.getAirdropByPk(filters.airdrop_id);
        if (!airdrop) {
            throw new errors_1.BadRequestError(`There is no airdrop with ID: ${filters.airdrop_id}`, 404);
        }
        const airdropData = await this.getUserAirdropData(idsFromTokens);
        const conditions = await this.getConditions(idsFromTokens, +airdrop.conditions.community_id_to_follow);
        return Object.assign({ airdrop_id: filters.airdrop_id, user_id: idsFromTokens.currentUserId, conditions }, airdropData);
    }
    // TODO - fetch from user airdrops
    static async getUserAirdropData(idsFromTokens) {
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
    static async getConditions(idsFromTokens, orgIdToFollow) {
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
module.exports = AirdropUsersService;
