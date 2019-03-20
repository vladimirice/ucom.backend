"use strict";
const knex = require("../../../config/knex");
const AccountsTransactionsCreatorService = require("../../accounts/service/accounts-transactions-creator-service");
const AccountsCreatorService = require("../../accounts/service/accounts-creator-service");
const AirdropsCreatorRepository = require("../repository/airdrops-creator-repository");
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
// @ts-ignore
const AIRDROPS_TOKENS = 'airdrops_tokens';
// @ts-ignore
const AIRDROPS_USERS = 'airdrops_users';
// @ts-ignore
const ACCOUNTS_TRANSACTIONS_PARTS = 'accounts_transactions_parts';
// @ts-ignore
const ACCOUNTS_TRANSACTIONS = 'accounts_transactions';
class AirdropCreatorService {
    static async createNewAirdrop(title, postId, conditions, tokens) {
        await knex.transaction(async (trx) => {
            const airdropId = await AirdropsCreatorRepository.createNewAirdrop(title, postId, conditions, trx);
            for (const token of tokens) {
                await this.createAccountsAndTrxForToken(token, airdropId, trx);
            }
        });
    }
    static async createAccountsAndTrxForToken(token, airdropId, trx) {
        const incomeAccountId = await AccountsCreatorService.createNewIncomeAccount(token.symbol_id, trx);
        const debtAccountId = await AccountsCreatorService.createNewDebtAccount(token.symbol_id, trx);
        await AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(incomeAccountId, debtAccountId, token.amount, trx);
        await trx(AIRDROPS_TOKENS).insert({
            airdrop_id: airdropId,
            income_account_id: incomeAccountId,
            debt_account_id: debtAccountId,
            status: AirdropStatuses.NEW,
        });
    }
}
module.exports = AirdropCreatorService;
