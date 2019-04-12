"use strict";
const ACCOUNTS_TABLE_NAME = 'accounts';
const ACCOUNTS_SYMBOLS_TABLE_NAME = 'accounts_symbols';
const ACCOUNTS_TRANSACTIONS_TABLE_NAME = 'accounts_transactions';
class AccountsModelProvider {
    static accountsTransactionsTableName() {
        return ACCOUNTS_TRANSACTIONS_TABLE_NAME;
    }
    static accountsTableName() {
        return ACCOUNTS_TABLE_NAME;
    }
    static accountsSymbolsTableName() {
        return ACCOUNTS_SYMBOLS_TABLE_NAME;
    }
}
module.exports = AccountsModelProvider;
