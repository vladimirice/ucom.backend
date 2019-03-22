"use strict";
const AccountsCreatorRepository = require("../repository/accounts-creator-repository");
// @ts-ignore
const ACCOUNTS = 'accounts';
// @ts-ignore
const ACCOUNTS_TRANSACTIONS_PARTS = 'accounts_transactions_parts';
class AccountsTransactionsCreatorService {
    static async createTrxBetweenTwoAccounts(accountIdFrom, accountIdTo, amount, trx, parentTrxId = null, jsonData = {}) {
        const transactionId = await AccountsCreatorRepository.createNewTransaction(jsonData, parentTrxId, trx);
        // FROM - negative
        await trx(ACCOUNTS_TRANSACTIONS_PARTS).insert({
            transaction_id: transactionId,
            account_id: accountIdFrom,
            amount: -amount,
        });
        // TO - positive
        await trx(ACCOUNTS_TRANSACTIONS_PARTS).insert({
            transaction_id: transactionId,
            account_id: accountIdTo,
            amount,
        });
        // FROM - update
        await trx(ACCOUNTS)
            .where({ id: accountIdFrom })
            .update({
            last_transaction_id: transactionId,
        })
            .decrement('current_balance', amount);
        // TO - update
        await trx(ACCOUNTS)
            .where({ id: accountIdTo })
            .update({
            last_transaction_id: transactionId,
        })
            .increment('current_balance', amount);
    }
}
module.exports = AccountsTransactionsCreatorService;
