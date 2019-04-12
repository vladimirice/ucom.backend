"use strict";
const models = require('../../../models');
const ENTITY_NAME = 'bl_nodes  ';
const TABLE_NAME = 'blockchain_nodes';
const OUTGOING_TRANSACTIONS_LOG = 'blockchain.outgoing_transactions_log';
class BlockchainModelProvider {
    static outgoingTransactionsLogTableName() {
        return OUTGOING_TRANSACTIONS_LOG;
    }
    static getEntityName() {
        return ENTITY_NAME;
    }
    static getModelName() {
        return TABLE_NAME;
    }
    static getTableName() {
        return TABLE_NAME;
    }
    static getModel() {
        return models[TABLE_NAME];
    }
    static getFieldsForPreview() {
        return this.getModel().getFieldsForPreview();
    }
}
module.exports = BlockchainModelProvider;
