const { WalletApi }             = require('uos-app-wallet');
const { HttpForbiddenError, BadRequestError }    = require('../../api/errors');
const BlockchainNodesRepository = require('../repository').Main;
const UsersRepository = require('../../../lib/users/repository').Main;
const UsersActivityService = require('../../../lib/users/user-activity-service');
const UsersActivityRepository = require('../../../lib/users/repository').Activity;

const QueryFilterService = require('../../api/filters/query-filter-service');

const Op = require('../../../models').sequelize.Op;
const _ = require('lodash');

class BlockchainService {
  /**
   *
   * @param {Object} currentUser
   */
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  static async updateBlockchainNodesByBlockchain() {
    const { producerData, voters } = await WalletApi.getBlockchainNodes();

    await Promise.all([
      BlockchainNodesRepository.createOrUpdateNodes(Object.values(producerData)),
      BlockchainNodesRepository.setDeletedAtNotExisted(Object.keys(producerData))
    ]);

    const voterToNodes = {};
    for (let i = 0; i < voters.length; i++) {
      const voter = voters[i];
      voterToNodes[voter.owner] = {
        producers:    voter.producers,
        account_name: voter.owner,
      };
    }

    const usersDataFromDb = await UsersRepository.findUserIdsByAccountNames(Object.keys(voterToNodes));

    const userAccountNameToId = {};
    usersDataFromDb.forEach(user => {
      userAccountNameToId[user.account_name] = user.id;
    });

    const blockchainNodesFromDb = await BlockchainNodesRepository.findBlockchainNodeIdsByAccountNames(Object.keys(producerData));
    const blockchainTitleToId = {};
    blockchainNodesFromDb.forEach(model => {
      blockchainTitleToId[model.title] = model.id;
    });

    // next - get all users ids and full up the array
    // get all nodes ids to fill users activity

    const votersToProcess = {};
    for (const voterAccountName in voterToNodes) {
      const voter = voterToNodes[voterAccountName];
      if (!userAccountNameToId[voterAccountName]) {
        continue;
      }

      voter.user_id = userAccountNameToId[voterAccountName];

      const producers = [];
      for (let i = 0; i < voter.producers.length; i++) {
        const producerTitle = voter.producers[i];
        producers.push(blockchainTitleToId[producerTitle]);
      }

      // TODO - filter accounts which does not present in our database

      voter.producers = producers;

      votersToProcess[voter.user_id] = voter;
      votersToProcess[voter.user_id].old_producers = [];
    }

    // Get "last" users activity, related to given account names (array, not single user)
    // compare new vote list state and old ones - create two deltas - create new ones and delete old ones

    // just create new ones

    const currentActivities = await UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity();

    // how to compare. We have votersToProcess - new activity list
    // and current activity. Lets fetch current activity and add oldData to VotersToProcess

    for (let m = 0; m < currentActivities.length; m++) {
      const activity = currentActivities[m];

      votersToProcess[activity.user_id_from].old_producers.push(+activity.entity_id_to);

      // here we have old producers and new producers
    }

    for (const voterId in votersToProcess) {
      const voterData = votersToProcess[voterId];

      let producersToCreate;
      let producersToCancel;

      if (!voterData.old_producers || _.isEmpty(voterData.old_producers)) {
        producersToCreate = voterData.producers;
      } else {
        producersToCreate = _.difference(voterData.producers, voterData.old_producers);
        producersToCancel = _.difference(voterData.old_producers, voterData.producers);
      }

      if (producersToCreate) {
        await UsersActivityService.processUserVotesChangingForBlockProducers(voterData.user_id, producersToCreate, null);
      }

      if (producersToCancel) {
        await UsersActivityService.processUserCancelVotesForBlockProducers(voterData.user_id, producersToCancel, null);
      }
    }
  }

  /**
   *
   * @param {Object} queryParams
   * @param {Object} query
   */
  _setWhereByRequestQuery(queryParams, query) {
    if (query.search) {
      queryParams.where.title = {
        [Op.iLike]: `%${query.search}%`
      }
    }
  }

  /**
   *
   * @param {Object} query
   * @private
   */
  _checkQueryParams(query) {
    if (!!query.myself_bp_vote && !this.currentUser.isCurrentUser()) {
      throw new HttpForbiddenError('myself_bp_vote = true parameter is allowed for auth users only');
    }

    if (query.page || query.per_page) {
      throw new BadRequestError('Pagination is not supported yet. It is forbidden to send page and per_page');
    }
  }

  /**
   * API method
   * @return {Object}
   */
  async getAndProcessNodes(query) {
    this._checkQueryParams(query);

    const currentAccountName = this.currentUser.isCurrentUser() ? this.currentUser.user.account_name : null;

    let queryParams = QueryFilterService.getQueryParameters(query, {}, UsersActivityRepository.getAllowedOrderBy());
    this._setWhereByRequestQuery(queryParams, query);

    let votedNodes = [];
    if (currentAccountName) {
      const activity = await UsersActivityRepository.findOneUserBlockchainNodesActivity(this.currentUser.id);

      activity.forEach(item => {
        votedNodes.push(+item.entity_id_to);
      });
    }

    const dataObjects = await BlockchainNodesRepository.findAllBlockchainNodes(queryParams);

    let data = [];
    for (let m = 0; m < dataObjects.length; m++) {
      const model = dataObjects[m];

      if (currentAccountName) {
        model.myselfData = {
          bp_vote: !!(~votedNodes.indexOf(model.id)),
        }
      }

      data.push(model);
    }

    if (!!query.myself_bp_vote) {
      const filteredData = [];

      for (let i = 0; i < data.length; i ++) {
        const item = data[i];
        if (item.myselfData.bp_vote === true) {
          filteredData.push(item);
        }
      }

      data = filteredData;
    }

    const metadata = {
      total_amount: 100,
      page: 1,
      per_page: 10,
      has_more: true,
    };

    return {
      data,
      metadata
    };
  }
}

module.exports = BlockchainService;