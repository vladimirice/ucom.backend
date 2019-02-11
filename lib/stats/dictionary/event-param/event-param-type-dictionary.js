"use strict";
const CURRENT_BLOCKCHAIN_IMPORTANCE = 1;
const BACKEND_CALCULATED_IMPORTANCE = 2;
const CURRENT_POST_VOTES = 3;
/** Exact event description */
class EventParamTypeDictionary {
    static getCurrentPostVotes() {
        return CURRENT_POST_VOTES;
    }
    static getCurrentBlockchainImportance() {
        return CURRENT_BLOCKCHAIN_IMPORTANCE;
    }
    static getBackendCalculatedImportance() {
        return BACKEND_CALCULATED_IMPORTANCE;
    }
}
module.exports = EventParamTypeDictionary;
