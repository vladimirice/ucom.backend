import { CheckManyObjectsOptionsDto, ObjectInterfaceRulesDto } from '../../interfaces/options-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

const { Dictionary } = require('ucom-libs-wallet');

import CommonChecker = require('../common/common-checker');
import ResponseHelper = require('../../integration/helpers/response-helper');
import BlockchainNodesCommon = require('./blockchain-nodes-common');

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
  public static checkThatVotesAreEmptyForOneUser(
    response: any,
    user: UserModel,
    blockchainNodesType: number,
  ) {
    const alias = BlockchainNodesCommon.getGraphQlNodeAlias(user, blockchainNodesType);
    const responseItem = response[alias];

    ResponseHelper.checkEmptyResponseList(responseItem);
  }

  public static checkVotesForOneUser(
    response: any,
    user: UserModel,
    mockingResponse: any,
    blockchainNodesType: number,
  ) {
    const alias = BlockchainNodesCommon.getGraphQlNodeAlias(user, blockchainNodesType);
    const responseItem = response[alias];
    const { data } = responseItem;

    ResponseHelper.checkListResponseStructure(responseItem);
    this.checkManyBlockchainNodesInterface(data);

    ResponseHelper.checkListResponseStructure(responseItem);
    BlockchainNodesChecker.checkManyBlockchainNodesInterface(data);

    const addToVote = blockchainNodesType === Dictionary.BlockchainNodes.typeBlockProducer() ?
      mockingResponse.addToVoteBlockProducers : mockingResponse.addToVoteCalculators;

    expect(data.length).toBe(addToVote[user.account_name].nodes.length);

    for (const title of addToVote[user.account_name].nodes) {
      const exists = data.some(item => item.title === title);
      expect(exists).toBeTruthy();
    }
  }

  public static checkManyBlockchainNodesInterface(manyActualObjects) {
    CommonChecker.checkArrayOfObjectsInterface(
      manyActualObjects,
      blockchainNodesInterfaceRules,
      blockchainNodesOptions,
    );
  }
}

export = BlockchainNodesChecker;
