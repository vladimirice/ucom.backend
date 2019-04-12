"use strict";
const errors_1 = require("../../api/errors");
const AccountsCreatorRepository = require("../repository/accounts-creator-repository");
const AccountsRepository = require("../repository/accounts-repository");
// @ts-ignore
const ACCOUNTS = 'accounts';
// @ts-ignore
const ACCOUNTS_TRANSACTIONS_PARTS = 'accounts_transactions_parts';
class AccountsTransactionsCreatorService {
    static async createTrxBetweenTwoAccounts(accountIdFrom, accountIdTo, amount, trx, allowNegativeFrom = false, parentTrxId = null, jsonData = {}, externalTrId = null) {
        const areSymbolsEqual = await AccountsRepository.areSymbolsEqual([accountIdFrom, accountIdTo], trx);
        if (!areSymbolsEqual) {
            throw new errors_1.AppError(`It is not possible to transfer between accounts of different symbols. Account Id from: ${accountIdFrom}, account ID to: ${accountIdTo}`, 500);
        }
        const transactionId = await AccountsCreatorRepository.createNewTransaction(jsonData, parentTrxId, externalTrId, trx);
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
        const newBalanceFrom = await trx(ACCOUNTS)
            .where({ id: accountIdFrom })
            .update({
            last_transaction_id: transactionId,
        })
            .decrement('current_balance', amount)
            .returning('current_balance');
        // TO - update
        await trx(ACCOUNTS)
            .where({ id: accountIdTo })
            .update({
            last_transaction_id: transactionId,
        })
            .increment('current_balance', amount)
            .returning('current_balance');
        if (!allowNegativeFrom && +newBalanceFrom < 0) {
            throw new errors_1.AppError(`Current balance of account from after transaction becomes negative. Account Id from: ${accountIdFrom}, account ID to: ${accountIdTo}`, 500);
        }
    }
}
module.exports = AccountsTransactionsCreatorService;
