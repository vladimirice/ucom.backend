/* tslint:disable:max-line-length */
import { AppError } from '../../api/errors';

import UsersRepository = require('../../users/users-repository');
import BlockchainNodesRepository = require('../repository/blockchain-nodes-repository');
import UsersActivityRepository = require('../../users/repository/users-activity-repository');

const _             = require('lodash');
const { BlockchainNodes, Dictionary } = require('ucom-libs-wallet');
const { WorkerLogger } = require('../../../config/winston');

const usersActivityService      = require('../../../lib/users/user-activity-service');

class BlockchainCacheService {
  static async updateBlockchainNodesByBlockchain() {
    const { blockProducersWithVoters, calculatorsWithVoters } = await BlockchainNodes.getAll();

    await this.processSingleBlockchainNodesType(
      blockProducersWithVoters,
      Dictionary.BlockchainNodes.typeBlockProducer(),
    );

    await this.processSingleBlockchainNodesType(
      calculatorsWithVoters,
      Dictionary.BlockchainNodes.typeCalculator(),
    );
  }

  private static async processSingleBlockchainNodesType(
    data: {indexedNodes, indexedVoters},
    blockchainNodesType: number,
  ): Promise<void> {
    await BlockchainNodesRepository.createOrUpdateNodes(
      Object.values(data.indexedNodes),
      blockchainNodesType,
    );

    const [userAccountNameToId, blockchainTitleToId, currentActivities] = await Promise.all([
      UsersRepository.findUserIdsByObjectIndexedByAccountNames(data.indexedVoters, 'account_name', 'id'),
      BlockchainNodesRepository.findBlockchainNodeIdsByObjectIndexedByTitle(data.indexedNodes),
      UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity(blockchainNodesType),
    ]);

    const votersToProcess = this.prepareVotersToProcess(
      userAccountNameToId,
      blockchainTitleToId,
      currentActivities,
      _.cloneDeep(data.indexedVoters),
    );

    const promises = this.prepareUsersActivityPromises(votersToProcess);

    await Promise.all(promises);
  }

  private static prepareVotersToProcess(
    userAccountNameToId,
    blockchainTitleToId,
    currentActivities,
    voters,
  ) {
    const votersToProcess = {};
    for (const voterAccountName in voters) {
      if (!voters.hasOwnProperty(voterAccountName)) {
        continue;
      }

      const voter = voters[voterAccountName];
      if (!userAccountNameToId[voterAccountName]) {
        // here is account which does exist in blockchain but does not exist for our web app
        continue;
      }

      voter.user_id = userAccountNameToId[voterAccountName];

      const nodes: any = [];

      if (!Array.isArray(voter.nodes)) {
        throw new AppError(`There is no field nodes inside the voter: ${JSON.stringify(voter)}`);
      }

      for (const nodeTitle of voter.nodes) {
        if (!blockchainTitleToId[nodeTitle]) {
          WorkerLogger.error(
            `There is node title ${nodeTitle} which is not present in db. Probably it is deleted. Skipped... Db set is: ${JSON.stringify(blockchainTitleToId)}`,
          );

          continue;
        }

        nodes.push(blockchainTitleToId[nodeTitle]);
      }

      voter.nodes = nodes;

      votersToProcess[voter.user_id] = voter;
      votersToProcess[voter.user_id].old_nodes = [];
    }

    for (const activity of currentActivities) {
      if (!votersToProcess[activity.user_id_from]) {
        WorkerLogger.error(
          `There is no such user Id ${activity.user_id_from} in votersToProcess. Lets skip activity with ID: ${activity.id}`,
        );

        continue;
      }

      votersToProcess[activity.user_id_from].old_nodes.push(+activity.entity_id_to);
    }

    return votersToProcess;
  }

  /**
   *
   * @param {Object} votersToProcess
   * @return {Array}
   * @private
   */
  private static prepareUsersActivityPromises(votersToProcess) {
    const promises: any = [];
    for (const voterId in votersToProcess) {
      if (!votersToProcess.hasOwnProperty(voterId)) {
        continue;
      }

      const voterData = votersToProcess[voterId];

      const producersToCreate = _.difference(voterData.nodes, voterData.old_nodes);
      const producersToCancel = _.difference(voterData.old_nodes, voterData.nodes);

      if (producersToCreate.length > 0) {
        promises.push(
          usersActivityService.processUserVotesChangingForBlockProducers(voterData.user_id, producersToCreate, null),
        );
      }

      if (producersToCancel.length > 0) {
        promises.push(
          usersActivityService.processUserCancelVotesForBlockProducers(voterData.user_id, producersToCancel, null),
        );
      }
    }

    return promises;
  }
}

export = BlockchainCacheService;
