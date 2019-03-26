"use strict";
const ACCOUNTS_TRANSACTIONS = 'accounts_transactions';
class AccountsCreatorRepository {
    static async createNewTransaction(jsonData, parentId, trx) {
        const res = await trx(ACCOUNTS_TRANSACTIONS).insert({
            parent_id: parentId,
            json_data: JSON.stringify(jsonData),
        }).returning(['id']);
        return +res[0].id;
    }
}
module.exports = AccountsCreatorRepository;
