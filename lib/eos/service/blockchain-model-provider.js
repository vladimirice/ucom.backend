"use strict";
const models = require('../../../models');
const ENTITY_NAME = 'bl_nodes  ';
const TABLE_NAME = 'blockchain_nodes';
class BlockchainModelProvider {
    /**
     *
     * @return {string}
     */
    static getEntityName() {
        return ENTITY_NAME;
    }
    /**
     *
     * @return {string}
     */
    static getModelName() {
        return TABLE_NAME;
    }
    /**
     *
     * @return {string}
     */
    static getTableName() {
        return TABLE_NAME;
    }
    /**
     *
     * @return {Object}
     */
    static getModel() {
        return models[TABLE_NAME];
    }
    /**
     *
     * @return {string[]}
     */
    static getFieldsForPreview() {
        return this.getModel().getFieldsForPreview();
    }
}
module.exports = BlockchainModelProvider;
