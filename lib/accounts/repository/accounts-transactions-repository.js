"use strict";
const knex = require("../../../config/knex");
const AccountsModelProvider = require("../service/accounts-model-provider");
const TABLE_NAME = AccountsModelProvider.accountsTransactionsTableName();
class AccountsTransactionsRepository {
    static async findOneById(id) {
        return knex(TABLE_NAME)
            .where('id', '=', id)
            .first();
    }
}
module.exports = AccountsTransactionsRepository;
