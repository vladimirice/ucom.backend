"use strict";
const errors_1 = require("../../api/errors");
const winston_1 = require("../../../config/winston");
const AuthService = require("../../auth/authService");
const UsersExternalRepository = require("../../users-external/repository/users-external-repository");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const AirdropsFetchRepository = require("../repository/airdrops-fetch-repository");
const AirdropsUsersExternalDataService = require("./airdrops-users-external-data-service");
const AirdropUsersValidator = require("../validator/airdrop-users-validator");
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
class AirdropUsersService {
    static async getOneUserAirdrop(req, filters) {
        const [currentUserDto, airdrop] = await Promise.all([
            this.getCurrentUserDto(req),
            AirdropsFetchRepository.getAirdropByPk(+filters.airdrop_id),
        ]);
        if (!airdrop) {
            throw new errors_1.BadRequestError(`There is no airdrop with ID: ${filters.airdrop_id}`, 404);
        }
        const [airdropData, conditions] = await Promise.all([
            this.getUserAirdropData(currentUserDto, airdrop),
            this.getConditions(currentUserDto, +airdrop.conditions.community_id_to_follow),
        ]);
        return Object.assign({ airdrop_id: airdrop.id, user_id: currentUserDto.currentUser ? currentUserDto.currentUser.id : null, conditions }, airdropData);
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
    static async getUserAirdropData(currentUserDto, airdrop) {
        const airdropState = await AirdropsFetchRepository.getAirdropStateById(airdrop.id);
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
            const externalData = await AirdropsUsersExternalDataService.processForUsersExternalId(airdrop, currentUserDto.userExternal);
            this.processWithExternalData(data, externalData, userTokens, airdropState, airdrop);
        }
        else if (currentUserDto.currentUser) {
            const externalData = await AirdropsUsersExternalDataService.processForCurrentUserId(airdrop, currentUserDto.currentUser);
            if (externalData) {
                this.processWithExternalData(data, externalData, userTokens, airdropState, airdrop);
            }
            // else do nothing - zero tokens response
        }
        else {
            throw new errors_1.AppError('Please check currentUsersDto conditions beforehand', 500);
        }
        return data;
    }
    static processWithExternalData(data, externalData, userTokens, airdropState, airdrop) {
        AirdropUsersValidator.checkTokensConsistency(userTokens, externalData.tokens);
        for (const token of externalData.tokens) {
            if (externalData.score === 0
                && airdrop.conditions.zero_score_incentive_tokens_amount === 0
                && token.amount_claim > 0) {
                winston_1.ApiLogger.error('Consistency check is failed. If score is 0 then all amount_claim must be 0', {
                    data,
                    external_data: JSON.stringify(externalData),
                    service: 'airdrops',
                });
                throw new errors_1.AppError('Internal server error');
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
module.exports = AirdropUsersService;
