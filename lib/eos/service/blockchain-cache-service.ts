/* tslint:disable:max-line-length */
const _             = require('lodash');
const { WalletApi } = require('ucom-libs-wallet');
const { WorkerLogger } = require('../../../config/winston');

const usersActivityService      = require('../../../lib/users/user-activity-service');

const usersRepository           = require('../../../lib/users/repository').Main;
const usersActivityRepository   = require('../../../lib/users/repository').Activity;
const blockchainNodesRepository = require('../repository').Main;

class BlockchainCacheService {
  static async updateBlockchainNodesByBlockchain() {
    const { producerData, voters } = await WalletApi.getBlockchainNodes();
    const votersAccounts    = Object.keys(voters);
    const producersAccounts = Object.keys(producerData);

    await Promise.all([
      blockchainNodesRepository.createOrUpdateNodes(Object.values(producerData)),
      blockchainNodesRepository.setDeletedAtNotExisted(producersAccounts),
    ]);

    const [userAccountNameToId, blockchainTitleToId, currentActivities] = await Promise.all([
      usersRepository.findUserIdsByAccountNames(votersAccounts),
      blockchainNodesRepository.findBlockchainNodeIdsByAccountNames(producersAccounts),
      usersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity(),
    ]);

    const votersToProcess = this.prepareVotersToProcess(
      userAccountNameToId,
      blockchainTitleToId,
      currentActivities,
      _.cloneDeep(voters),
    );

    const promises = this.prepareUsersActivityPromises(votersToProcess);

    return await Promise.all(promises);
  }

  // noinspection FunctionWithMultipleLoopsJS
  /**
   *
   * @param {Object} userAccountNameToId
   * @param {Object} blockchainTitleToId
   * @param {Object[]} currentActivities
   * @param {object} voters
   * @private
   */
  private static prepareVotersToProcess(
    userAccountNameToId,
    blockchainTitleToId,
    currentActivities,
    voters,
  ) {
    const votersToProcess = {};
    for (const voterAccountName in voters) {
      const voter = voters[voterAccountName];
      if (!userAccountNameToId[voterAccountName]) {
        // here is account which does exist in blockchain but does not exist for our web app
        continue;
      }

      voter.user_id = userAccountNameToId[voterAccountName];

      const producers: any = [];
      for (let i = 0; i < voter.producers.length; i += 1) {
        const producerTitle = voter.producers[i];

        if (!blockchainTitleToId[producerTitle]) {
          WorkerLogger.error(
            `There is node title ${producerTitle} which is not present in db. Probably it is deleted. Skipped... Db set is: ${JSON.stringify(blockchainTitleToId)}`,
          );

          continue;
        }

        producers.push(blockchainTitleToId[producerTitle]);
      }

      voter.producers = producers;

      votersToProcess[voter.user_id] = voter;
      votersToProcess[voter.user_id].old_producers = [];
    }

    for (let m = 0; m < currentActivities.length; m += 1) {
      const activity = currentActivities[m];

      if (!votersToProcess[activity.user_id_from]) {
        WorkerLogger.error(
          `There is no such user Id ${activity.user_id_from} in votersToProcess. Lets skip activity with ID: ${activity.id}`,
        );

        continue;
      }

      votersToProcess[activity.user_id_from].old_producers.push(+activity.entity_id_to);
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
      const voterData = votersToProcess[voterId];

      const producersToCreate = _.difference(voterData.producers, voterData.old_producers);
      const producersToCancel = _.difference(voterData.old_producers, voterData.producers);

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
