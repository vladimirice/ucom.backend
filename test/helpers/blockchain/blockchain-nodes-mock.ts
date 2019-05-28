import _ = require('lodash');
import BlockchainCacheService = require('../../../lib/blockchain-nodes/service/blockchain-cache-service');

// @ts-ignore
const { BlockchainNodes, Dictionary } = require('ucom-libs-wallet');

class BlockchainNodesMock {
  private static getDataToMock(
    targetData: any,
    firstAccountName: string,
    secondAccountName: string,
    blockchainNodesType: number,
  ) {
    let firstMockedNodeTitle;
    let secondMockedNodeTitle;
    if (blockchainNodesType === Dictionary.BlockchainNodes.typeBlockProducer()) {
      firstMockedNodeTitle = 'z_super_new1';
      secondMockedNodeTitle = 'z_super_new2';
    } else if (blockchainNodesType === Dictionary.BlockchainNodes.typeCalculator()) {
      firstMockedNodeTitle = 'z_calculator_super_new1';
      secondMockedNodeTitle = 'z_calculator_super_new2';
    } else {
      throw new TypeError(`Unsupported blockchainNodesType: ${blockchainNodesType}`);
    }

    const producers = Object.keys(targetData.indexedNodes);

    return {
      [firstAccountName]: {
        owner: firstAccountName,
        nodes: [
          producers[0],
          producers[2],
          producers[3],
          secondMockedNodeTitle,
        ],
      },
      [secondAccountName]: {
        owner: secondAccountName,
        nodes: [
          producers[1],
          producers[3],
          firstMockedNodeTitle,
          producers[4],
        ],
      },
    };
  }


  public static async mockBlockchainNodesProvider(
    firstAccountName: string,
    secondAccountName: string,
    blockchainNodesType: number,
  ): Promise<any> {
    const { blockProducersWithVoters, calculatorsWithVoters } = await BlockchainNodes.getAll();

    let addToVoteCalculators = {};
    let addToVoteBlockProducers = {};
    if (blockchainNodesType === Dictionary.BlockchainNodes.typeBlockProducer()) {
      addToVoteBlockProducers = this.getDataToMock(blockProducersWithVoters, firstAccountName, secondAccountName, blockchainNodesType);
    } else if (blockchainNodesType === Dictionary.BlockchainNodes.typeCalculator()) {
      addToVoteCalculators = this.getDataToMock(calculatorsWithVoters, firstAccountName, secondAccountName, blockchainNodesType);
    } else if (blockchainNodesType === 100) {
      addToVoteBlockProducers = this.getDataToMock(
        blockProducersWithVoters,
        firstAccountName,
        secondAccountName,
        Dictionary.BlockchainNodes.typeBlockProducer(),
      );
      addToVoteCalculators = this.getDataToMock(
        calculatorsWithVoters,
        firstAccountName,
        secondAccountName,
        Dictionary.BlockchainNodes.typeCalculator(),
      );
    } else {
      throw new TypeError(`Unsupported blockchainNodesType: ${blockchainNodesType}`);
    }

    const mockedResult = await this.mockGetBlockchainNodesWalletMethod(
      _.cloneDeep(addToVoteBlockProducers),
      false,
      _.cloneDeep(addToVoteCalculators),
    );

    await BlockchainCacheService.updateBlockchainNodesByBlockchain();

    return {
      addToVoteBlockProducers,
      addToVoteCalculators,
      mockedResult,
    };
  }

  public static async mockGetBlockchainNodesWalletMethod(
    addToVote = {},
    toDelete = true,
    addCalculatorsToVote = {},
    extraCalculatorsToAdd = {},
  ) {
    const { blockProducersWithVoters, calculatorsWithVoters } = await BlockchainNodes.getAll();

    let initialCalculatorsData = calculatorsWithVoters.indexedNodes;

    const initialData = blockProducersWithVoters.indexedNodes;
    let voters = blockProducersWithVoters.indexedVoters;
    voters = {
      ...voters,
      ...addToVote,
    };

    let calculatorsVoters = calculatorsWithVoters.indexedVoters;

    calculatorsVoters = {
      ...calculatorsVoters,
      ...addCalculatorsToVote,
    };

    initialData.z_super_new1 = {
      title: 'z_super_new1',
      votes_count: 5,
      votes_amount: 100,
      scaled_importance_amount: 10.02,
      currency: 'UOS',
      bp_status: 1,
    };

    initialData.z_super_new2 = {
      title: 'z_super_new2',
      votes_count: 5,
      votes_amount: 100,
      scaled_importance_amount: 10.02,
      currency: 'UOS',
      bp_status: 1,
    };

    initialCalculatorsData.z_calculator_super_new1 = {
      title: 'z_calculator_super_new1',
      votes_count: 6,
      votes_amount: 64,
      scaled_importance_amount: 15.02,
      currency: 'UOS',
      bp_status: 1,
    };

    initialCalculatorsData.z_calculator_super_new2 = {
      title: 'z_calculator_super_new2',
      votes_count: 7,
      votes_amount: 95,
      scaled_importance_amount: 8.02,
      currency: 'UOS',
      bp_status: 1,
    };


    initialCalculatorsData = {
      ...initialCalculatorsData,
      ...extraCalculatorsToAdd,
    };

    const created = [
      initialData.z_super_new1,
      initialData.z_super_new2,
    ];

    const createdCalculators = [
      initialCalculatorsData.z_calculator_super_new1,
      initialCalculatorsData.z_calculator_super_new2,
    ];

    for (const extraCalculatorTitle in extraCalculatorsToAdd) {
      if (!extraCalculatorsToAdd.hasOwnProperty(extraCalculatorTitle)) {
        continue;
      }

      createdCalculators.push(extraCalculatorTitle);
    }

    // lets also change something
    const dataKeys = Object.keys(initialData);

    const deleted: any = [];
    if (toDelete) {
      deleted.push(dataKeys[0]);
    }

    const updated = [
      initialData[dataKeys[1]],
      initialData[dataKeys[2]],
    ];

    initialData[dataKeys[1]].votes_count = 10;
    initialData[dataKeys[1]].votes_amount = 250;

    initialData[dataKeys[2]].bp_status = 2;
    initialData[dataKeys[2]].votes_amount = 0;
    initialData[dataKeys[2]].votes_count = 0;

    deleted.forEach((index) => {
      delete initialData[index];
    });

    BlockchainNodes.getAll = async (): Promise<{ blockProducersWithVoters, calculatorsWithVoters }> => ({
      blockProducersWithVoters: {
        indexedVoters: voters,
        indexedNodes: initialData,
      },
      calculatorsWithVoters: {
        indexedVoters: calculatorsVoters,
        indexedNodes: initialCalculatorsData,
      },
    });

    return {
      created,
      updated,
      deleted,

      createdCalculators,
    };
  }
}

export = BlockchainNodesMock;
