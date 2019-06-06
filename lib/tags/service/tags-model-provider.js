"use strict";
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const ENTITY_NAME = EntityNames.TAGS;
const TABLE_NAME = 'tags';
const BLOCKCHAIN_ID_PREFIX = 'tag';
class TagsModelProvider {
    static getBlockchainIdPrefix() {
        return BLOCKCHAIN_ID_PREFIX;
    }
    static getCurrentParamsTableName() {
        return 'tags_current_params';
    }
    static getEntityName() {
        return ENTITY_NAME;
    }
    static getTableName() {
        return TABLE_NAME;
    }
}
module.exports = TagsModelProvider;
