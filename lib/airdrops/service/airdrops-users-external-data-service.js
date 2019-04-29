"use strict";
const errors_1 = require("../../api/errors");
const AirdropsUsersExternalDataRepository = require("../repository/airdrops-users-external-data-repository");
const UsersExternalRepository = require("../../users-external/repository/users-external-repository");
const AccountsSymbolsRepository = require("../../accounts/repository/accounts-symbols-repository");
const AirdropsUsersGithubRawRepository = require("../repository/airdrops-users-github-raw-repository");
const AirdropsTokensRepository = require("../repository/airdrops-tokens-repository");
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
class AirdropsUsersExternalDataService {
    static async processForCurrentUserId(airdropId, currentUserDto) {
        const data = await UsersExternalRepository.getUserExternalWithExternalAirdropData(currentUserDto.id);
        if (!data) {
            return null;
        }
        if (data.json_data) {
            return Object.assign({}, data.json_data, { status: data.status });
        }
        if (data.primary_key && data.json_data === null) {
            return this.createSampleUsersExternalData(airdropId, data.primary_key, data.external_id);
        }
        throw new errors_1.AppError(`Malformed response: ${JSON.stringify(data)}`, 500);
    }
    static async processForUsersExternalId(airdropId, userExternalDto) {
        const externalData = await AirdropsUsersExternalDataRepository.getOneByUsersExternalId(userExternalDto.id);
        if (externalData) {
            return Object.assign({}, externalData.json_data, { status: externalData.status });
        }
        return this.createSampleUsersExternalData(airdropId, userExternalDto.id, userExternalDto.external_id);
    }
    static async createSampleUsersExternalData(airdropId, usersExternalId, githubUserId) {
        const jsonData = await this.getSampleUsersExternalData(airdropId, usersExternalId, githubUserId);
        await AirdropsUsersExternalDataRepository.insertOneData(airdropId, usersExternalId, jsonData.score, jsonData);
        return Object.assign({}, jsonData, { status: AirdropStatuses.NEW });
    }
    static async getSampleUsersExternalData(airdropId, usersExternalId, githubUserId, majorTokens = false) {
        const commonData = await this.getUserAirdropCommonData(airdropId, usersExternalId, majorTokens);
        return Object.assign({}, commonData, { external_user_id: githubUserId });
    }
    static async getUserAirdropCommonData(airdropId, usersExternalId, majorTokens) {
        const externalData = await UsersExternalRepository.findGithubUserExternalByPkId(usersExternalId);
        if (externalData === null) {
            throw new errors_1.AppError(`There is no external data with pk: ${usersExternalId}`);
        }
        const rawData = await AirdropsUsersGithubRawRepository.getScoreAndAmountByGithubId(+externalData.external_id);
        const resultScore = rawData === null ? 0 : rawData.score;
        const resultAmount = rawData === null ? 0 : rawData.amount;
        const airdropsTokens = await AirdropsTokensRepository.getAirdropsAccountDataById(airdropId);
        const tokensForUser = [];
        for (const oneToken of airdropsTokens) {
            tokensForUser.push({
                amount_claim: resultAmount,
                symbol: oneToken.symbol,
            });
        }
        const data = {
            airdrop_id: airdropId,
            score: resultScore,
            tokens: tokensForUser,
        };
        if (!majorTokens) {
            return data;
        }
        const accountsSymbols = await AccountsSymbolsRepository.findAllAccountsSymbols();
        data.tokens.forEach((token) => {
            const symbol = accountsSymbols.find(item => item.title === token.symbol);
            if (!symbol) {
                throw new errors_1.AppError(`There is no symbol with title: ${token.symbol}`, 500);
            }
            token.amount_claim /= 10 ** symbol.precision;
        });
        return data;
    }
}
module.exports = AirdropsUsersExternalDataService;
