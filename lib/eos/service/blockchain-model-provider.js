"use strict";
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const models = require('../../../models');
const ENTITY_NAME = EntityNames.BLOCKCHAIN_NODES;
const TABLE_NAME = 'blockchain_nodes';
const OUTGOING_TRANSACTIONS_LOG = 'blockchain.outgoing_transactions_log';
const IRREVERSIBLE_TRACES = 'blockchain.irreversible_traces';
class BlockchainModelProvider {
    static irreversibleTracesTableName() {
        return IRREVERSIBLE_TRACES;
    }
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
