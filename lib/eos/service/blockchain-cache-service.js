const _             = require('lodash');
const { WalletApi } = require('uos-app-wallet');

const UsersActivityService      = require('../../../lib/users/user-activity-service');

const UsersRepository           = require('../../../lib/users/repository').Main;
const UsersActivityRepository   = require('../../../lib/users/repository').Activity;
const BlockchainNodesRepository = require('../repository').Main;

class BlockchainCacheService {
  static async updateBlockchainNodesByBlockchain() {
    const { producerData, voters } = await WalletApi.getBlockchainNodes();
    const votersAccounts    = Object.keys(voters);
    const producersAccounts = Object.keys(producerData);

    await Promise.all([
      BlockchainNodesRepository.createOrUpdateNodes(Object.values(producerData)),
      BlockchainNodesRepository.setDeletedAtNotExisted(producersAccounts),
    ]);

    const [userAccountNameToId, blockchainTitleToId, currentActivities] = await Promise.all([
      UsersRepository.findUserIdsByAccountNames(votersAccounts),
      BlockchainNodesRepository.findBlockchainNodeIdsByAccountNames(producersAccounts),
      UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity(),
    ]);

    const votersToProcess = this._prepareVotersToProcess(
      userAccountNameToId,
      blockchainTitleToId,
      currentActivities,
      _.cloneDeep(voters),
    );

    const promises = this._prepareUsersActivityPromises(votersToProcess);

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
  static _prepareVotersToProcess(userAccountNameToId, blockchainTitleToId, currentActivities, voters) {
    const votersToProcess = {};
    for (const voterAccountName in voters) {
      const voter = voters[voterAccountName];
      if (!userAccountNameToId[voterAccountName]) {
        continue;
      }

      voter.user_id = userAccountNameToId[voterAccountName];

      const producers = [];
      for (let i = 0; i < voter.producers.length; i++) {
        const producerTitle = voter.producers[i];

        if (!blockchainTitleToId[producerTitle]) {
          throw new Error(
            `There is node title ${producerTitle} which is not present in db. Db set is: ${JSON.stringify(blockchainTitleToId)}`
          );
        }

        producers.push(blockchainTitleToId[producerTitle]);
      }

      voter.producers = producers;

      votersToProcess[voter.user_id] = voter;
      votersToProcess[voter.user_id].old_producers = [];
    }

    for (let m = 0; m < currentActivities.length; m++) {
      const activity = currentActivities[m];

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
  static _prepareUsersActivityPromises(votersToProcess) {
    const promises = [];
    for (const voterId in votersToProcess) {
      const voterData = votersToProcess[voterId];

      let producersToCreate = _.difference(voterData.producers, voterData.old_producers);
      let producersToCancel = _.difference(voterData.old_producers, voterData.producers);

      if (producersToCreate.length > 0) {
        promises.push(
          UsersActivityService.processUserVotesChangingForBlockProducers(voterData.user_id, producersToCreate, null)
        );
      }

      if (producersToCancel.length > 0) {
        promises.push(
          UsersActivityService.processUserCancelVotesForBlockProducers(voterData.user_id, producersToCancel, null)
        );
      }
    }

    return promises;
  }

}

module.exports = BlockchainCacheService;