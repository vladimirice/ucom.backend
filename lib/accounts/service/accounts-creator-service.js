"use strict";
const AccountTypesDictionary = require("../dictionary/account-types-dictionary");
const ACCOUNTS_TABLE_NAME = 'accounts';
class AccountsCreatorService {
    static async createNewIncomeAccount(symbolId, trx) {
        return this.createNewAccount(AccountTypesDictionary.income(), symbolId, null, trx);
    }
    static async createNewDebtAccount(symbolId, trx) {
        return this.createNewAccount(AccountTypesDictionary.debt(), symbolId, null, trx);
    }
    static async createNewAccount(accountType, symbolId, userId, trx) {
        const res = await trx(ACCOUNTS_TABLE_NAME).insert({
            account_type: accountType,
            user_id: userId,
            symbol_id: symbolId,
            current_balance: 0,
            last_transaction_id: null,
        }).returning(['id']);
        return +res[0].id;
    }
}
module.exports = AccountsCreatorService;
