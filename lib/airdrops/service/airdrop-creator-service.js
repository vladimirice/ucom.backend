"use strict";
const knex = require("../../../config/knex");
const AccountsTransactionsCreatorService = require("../../accounts/service/accounts-transactions-creator-service");
const AccountsCreatorService = require("../../accounts/service/accounts-creator-service");
const AirdropsCreatorRepository = require("../repository/airdrops-creator-repository");
const AirdropsTokensRepository = require("../repository/airdrops-tokens-repository");
class AirdropCreatorService {
    static async createNewAirdrop(title, postId, conditions, startedAt, finishedAt, tokens) {
        const { id: airdropId } = await knex.transaction(async (trx) => {
            const id = await AirdropsCreatorRepository.createNewAirdrop(title, postId, conditions, startedAt, finishedAt, trx);
            for (const token of tokens) {
                await this.createAccountsAndTrxForToken(token, id, trx);
            }
            return { id };
        });
        return {
            airdropId,
        };
    }
    static async createAccountsAndTrxForToken(token, airdropId, trx) {
        const incomeAccountId = await AccountsCreatorService.createNewIncomeAccount(token.symbol_id, trx);
        const debtAccountId = await AccountsCreatorService.createNewDebtAccount(token.symbol_id, trx);
        await AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(incomeAccountId, debtAccountId, token.amount, trx, true);
        await AirdropsTokensRepository.insertNewRecord(airdropId, incomeAccountId, debtAccountId, trx);
    }
}
module.exports = AirdropCreatorService;
