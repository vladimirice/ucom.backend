const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const models = require('../../../models');

const ENTITY_NAME = EntityNames.BLOCKCHAIN_NODES;
const TABLE_NAME  = 'blockchain_nodes';
const OUTGOING_TRANSACTIONS_LOG  = 'blockchain.outgoing_transactions_log';

class BlockchainModelProvider {
  public static outgoingTransactionsLogTableName(): string {
    return OUTGOING_TRANSACTIONS_LOG;
  }

  public static getEntityName(): string {
    return ENTITY_NAME;
  }

  public static getModelName(): string {
    return TABLE_NAME;
  }

  public static getTableName(): string {
    return TABLE_NAME;
  }

  public static getModel(): any {
    return models[TABLE_NAME];
  }

  public static getFieldsForPreview(): string[] {
    return this.getModel().getFieldsForPreview();
  }
}

export = BlockchainModelProvider;
