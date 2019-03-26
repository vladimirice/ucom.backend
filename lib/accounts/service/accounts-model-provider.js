"use strict";
const ACCOUNTS_TABLE_NAME = 'accounts';
const ACCOUNTS_SYMBOLS_TABLE_NAME = 'accounts_symbols';
class AccountsModelProvider {
    static accountsTableName() {
        return ACCOUNTS_TABLE_NAME;
    }
    static accountsSymbolsTableName() {
        return ACCOUNTS_SYMBOLS_TABLE_NAME;
    }
}
module.exports = AccountsModelProvider;
