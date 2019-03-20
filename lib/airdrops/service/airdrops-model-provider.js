"use strict";
const AIRDROPS_TABLE_NAME = 'airdrops';
const AIRDROPS_TOKENS_TABLE_NAME = 'airdrops_tokens';
class AirdropsModelProvider {
    static airdropsTableName() {
        return AIRDROPS_TABLE_NAME;
    }
    static airdropsTokensTableName() {
        return AIRDROPS_TOKENS_TABLE_NAME;
    }
}
module.exports = AirdropsModelProvider;
