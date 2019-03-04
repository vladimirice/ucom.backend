"use strict";
const ENTITY_NAME = 'all       ';
const FAKE_BLOCKCHAIN_ID = 'not-determined-id';
const FAKE_ENTITY_ID = 1;
class CommonModelProvider {
    static getEntityName() {
        return ENTITY_NAME;
    }
    static getFakeEntityId() {
        return FAKE_ENTITY_ID;
    }
    static getFakeBlockchainId() {
        return FAKE_BLOCKCHAIN_ID;
    }
}
module.exports = CommonModelProvider;
