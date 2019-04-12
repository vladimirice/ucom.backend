"use strict";
const AccountsModelProvider = require("../service/accounts-model-provider");
const ACCOUNTS_TRANSACTIONS = AccountsModelProvider.accountsTransactionsTableName();
class AccountsCreatorRepository {
    static async createNewTransaction(jsonData, parentId, externalTrId, trx) {
        const res = await trx(ACCOUNTS_TRANSACTIONS).insert({
            parent_id: parentId,
            external_tr_id: externalTrId,
            json_data: JSON.stringify(jsonData),
        }).returning(['id']);
        return +res[0].id;
    }
}
module.exports = AccountsCreatorRepository;
