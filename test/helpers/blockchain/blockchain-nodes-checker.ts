import { CheckManyObjectsOptionsDto, ObjectInterfaceRulesDto } from '../../interfaces/options-interfaces';

import CommonChecker = require('../common/common-checker');

const blockchainNodesInterfaceRules: ObjectInterfaceRulesDto = {
  id: {
    type: 'number',
    length: 1,
  },
  title: {
    type: 'string',
    length: 1,
  },
  votes_count: {
    type: 'number',
    length: 0,
  },
  votes_amount: {
    type: 'number',
    length: 0,
  },
  votes_percentage: {
    type: 'number',
    length: 0,
  },
  currency: {
    type: 'string',
    length: 1,
    value: 'UOS',
  },
  scaled_importance_amount: {
    type: 'number',
    length: 0,
  },
  bp_status: {
    type: 'number',
    length: 0,
    allowed_values: [1, 2, 3],
  },
  blockchain_nodes_type: {
    type: 'number',
    length: 0,
    allowed_values: [1, 2],
  },
};

const blockchainNodesOptions: CheckManyObjectsOptionsDto = {
  exactKeysAmount: true,
};

class BlockchainNodesChecker {
  public static checkManyBlockchainNodesInterface(manyActualObjects) {
    CommonChecker.checkArrayOfObjectsInterface(
      manyActualObjects,
      blockchainNodesInterfaceRules,
      blockchainNodesOptions,
    );
  }
}

export = BlockchainNodesChecker;
