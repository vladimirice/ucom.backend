"use strict";
const errors_1 = require("../../api/errors");
const AuthService = require("../../auth/authService");
const UsersExternalRepository = require("../../users-external/repository/users-external-repository");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const AirdropsFetchRepository = require("../repository/airdrops-fetch-repository");
const AirdropsUsersExternalDataService = require("./airdrops-users-external-data-service");
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
class AirdropUsersService {
    static async getOneUserAirdrop(req, filters) {
        const currentUserDto = await this.getCurrentUserDto(req);
        const airdrop = await AirdropsFetchRepository.getAirdropByPk(filters.airdrop_id);
        if (!airdrop) {
            throw new errors_1.BadRequestError(`There is no airdrop with ID: ${filters.airdrop_id}`, 404);
        }
        const airdropData = await this.getUserAirdropData(currentUserDto, filters.airdrop_id);
        const conditions = await this.getConditions(currentUserDto, +airdrop.conditions.community_id_to_follow);
        return Object.assign({ airdrop_id: filters.airdrop_id, user_id: currentUserDto.currentUser ? currentUserDto.currentUser.id : null, conditions }, airdropData);
    }
    static async getCurrentUserDto(req) {
        const idsFromTokens = AuthService.getIdsFromAuthTokens(req);
        const res = {
            currentUser: null,
            userExternal: null,
        };
        if (idsFromTokens.currentUserId) {
            res.currentUser = {
                id: idsFromTokens.currentUserId,
            };
        }
        if (idsFromTokens.usersExternalId) {
            const userExternal = await UsersExternalRepository.findGithubUserExternalByPkId(idsFromTokens.usersExternalId);
            if (!userExternal) {
                throw new errors_1.BadRequestError(`Malformed userExternal ID inside token: ${idsFromTokens.usersExternalId}`, 400);
            }
            res.userExternal = {
                id: idsFromTokens.usersExternalId,
                external_id: userExternal.external_id,
            };
        }
        return res;
    }
    static async getUserAirdropData(currentUserDto, airdropId) {
        const airdropState = await AirdropsFetchRepository.getAirdropStateById(airdropId);
        const userTokens = [];
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
            const externalData = await AirdropsUsersExternalDataService.processForUsersExternalId(airdropId, currentUserDto.userExternal);
            this.processWithExternalData(data, externalData, userTokens, airdropState);
        }
        else if (currentUserDto.currentUser) {
            const externalData = await AirdropsUsersExternalDataService.processForCurrentUserId(airdropId, currentUserDto.currentUser);
            if (externalData) {
                this.processWithExternalData(data, externalData, userTokens, airdropState);
            }
            // else do nothing - zero tokens response
        }
        else {
            throw new errors_1.AppError('Please check currentUsersDto conditions beforehand', 500);
        }
        return data;
    }
    static processWithExternalData(data, externalData, userTokens, airdropState) {
        this.checkTokensConsistency(userTokens, externalData.tokens);
        data.score = externalData.score;
        data.tokens = externalData.tokens;
        data.tokens.forEach((token) => {
            const stateToken = airdropState.tokens.find(airdropToken => airdropToken.symbol === token.symbol);
            token.amount_claim /= (10 ** stateToken.precision);
        });
    }
    static checkTokensConsistency(airdropTokens, userTokens) {
        if (airdropTokens.length !== userTokens.length) {
            throw new errors_1.AppError(`Airdrop tokens and userTokens have different length. Airdrop tokens: ${JSON.stringify(airdropTokens)}, userTokens: ${JSON.stringify(userTokens)}`, 500);
        }
        for (const expectedToken of airdropTokens) {
            const userToken = userTokens.some(item => item.symbol === expectedToken.symbol);
            if (!userToken) {
                throw new errors_1.AppError(`There is no token of symbol ${expectedToken.symbol} in userTokens. Airdrop tokens: ${JSON.stringify(airdropTokens)}, userTokens: ${JSON.stringify(userTokens)}`, 500);
            }
        }
    }
    static async getConditions(currentUserDto, orgIdToFollow) {
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
            if (currentUserDto.currentUser) {
                const userExternal = await UsersExternalRepository.findGithubUserExternalByUserId(currentUserDto.currentUser.id);
                conditions.auth_github = userExternal !== null;
            }
        }
        if (currentUserDto.currentUser) {
            conditions.following_devExchange =
                await UsersActivityRepository.doesUserFollowOrg(currentUserDto.currentUser.id, orgIdToFollow);
        }
        return conditions;
    }
}
module.exports = AirdropUsersService;
