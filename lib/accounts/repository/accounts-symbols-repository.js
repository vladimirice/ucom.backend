"use strict";
const AccountsModelProvider = require("../service/accounts-model-provider");
const knex = require("../../../config/knex");
const TABLE_NAME = AccountsModelProvider.accountsSymbolsTableName();
class AccountsSymbolsRepository {
    static async findAllAccountsSymbols() {
        return knex(TABLE_NAME);
    }
    static async findAllAccountsSymbolsIndexedByTitle() {
        const data = await this.findAllAccountsSymbols();
        const res = {};
        data.forEach((item) => {
            res[item.title] = +item.id;
        });
        return res;
    }
}
module.exports = AccountsSymbolsRepository;
