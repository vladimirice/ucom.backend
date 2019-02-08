"use strict";
const ENTITY_NAME = 'tags      ';
const TABLE_NAME = 'tags';
class TagsModelProvider {
    static getEntityName() {
        return ENTITY_NAME;
    }
    static getTableName() {
        return TABLE_NAME;
    }
}
module.exports = TagsModelProvider;
