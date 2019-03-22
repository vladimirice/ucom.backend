"use strict";
const AccountsModelProvider = require("../service/accounts-model-provider");
const knex = require("../../../config/knex");
const TABLE_NAME = AccountsModelProvider.accountsSymbolsTableName();
class AccountsSymbolsRepository {
    static async findAllAccountsSymbols() {
        return knex(TABLE_NAME);
    }
}
module.exports = AccountsSymbolsRepository;
