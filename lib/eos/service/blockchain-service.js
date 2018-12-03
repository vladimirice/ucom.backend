const BlockchainCacheService          = require('./blockchain-cache-service');
const BlockchainApiFetchService       = require('./blockchain-api-fetch-service');
const BlockchainTrTracesFetchService  = require('./blockchain-tr-traces-fetch-service');


class BlockchainService {
  /**
   *
   * @param {Object} currentUser
   */
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getAndProcessMyselfBlockchainTransactions(query) {
    const accountName = this.currentUser.user.account_name;

    return await BlockchainTrTracesFetchService.getAndProcessOneUserTraces(query, accountName);
  }

  /**
   * API method
   * @return {Object}
   */
  async getAndProcessNodes(query) {
    const userId = this.currentUser.id;

    return await BlockchainApiFetchService.getAndProcessNodes(query, userId);
  }

  static async updateBlockchainNodesByBlockchain() {
    return await BlockchainCacheService.updateBlockchainNodesByBlockchain();
  }
}

module.exports = BlockchainService;