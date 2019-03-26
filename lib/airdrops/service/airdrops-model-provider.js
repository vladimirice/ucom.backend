"use strict";
const AIRDROPS_TABLE_NAME = 'airdrops';
const AIRDROPS_TOKENS_TABLE_NAME = 'airdrops_tokens';
const AIRDROPS_USERS_TABLE_NAME = 'airdrops_users';
const AIRDROPS_USERS_EXTERNAL_DATA_TABLE_NAME = 'airdrops_users_external_data';
class AirdropsModelProvider {
    static airdropsUsersExternalDataTableName() {
        return AIRDROPS_USERS_EXTERNAL_DATA_TABLE_NAME;
    }
    static airdropsTableName() {
        return AIRDROPS_TABLE_NAME;
    }
    static airdropsTokensTableName() {
        return AIRDROPS_TOKENS_TABLE_NAME;
    }
    static airdropsUsersTableName() {
        return AIRDROPS_USERS_TABLE_NAME;
    }
}
module.exports = AirdropsModelProvider;
