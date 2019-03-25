"use strict";
const AccountsModelProvider = require("../service/accounts-model-provider");
const TABLE_NAME = AccountsModelProvider.accountsTableName();
class AccountsRepository {
    static async areSymbolsEqual(accountsIds, trx) {
        const data = await trx(TABLE_NAME)
            .select([
            'id',
            'symbol_id',
        ])
            .whereIn('id', accountsIds);
        const symbolToMatch = data[0].symbol_id;
        for (let i = 1; i < data.length; i += 1) {
            if (data[i].symbol_id !== symbolToMatch) {
                return false;
            }
        }
        return true;
    }
}
module.exports = AccountsRepository;
