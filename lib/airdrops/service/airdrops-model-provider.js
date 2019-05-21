"use strict";
const AIRDROPS_TABLE_NAME = 'airdrops';
const AIRDROPS_TOKENS_TABLE_NAME = 'airdrops_tokens';
const AIRDROPS_USERS_TABLE_NAME = 'airdrops_users';
const AIRDROPS_USERS_EXTERNAL_DATA_TABLE_NAME = 'airdrops_users_external_data';
const AIRDROPS_USERS_GITHUB_RAW_TABLE_NAME = 'airdrops_users_github_raw';
const AIRDROPS_USERS_GITHUB_RAW_ROUND_TWO_TABLE_NAME = 'airdrops_users_github_raw_round_two';
class AirdropsModelProvider {
    static airdropsUsersGithubRawTableName() {
        return AIRDROPS_USERS_GITHUB_RAW_TABLE_NAME;
    }
    static airdropsUsersGithubRawRoundTwoTableName() {
        return AIRDROPS_USERS_GITHUB_RAW_ROUND_TWO_TABLE_NAME;
    }
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
