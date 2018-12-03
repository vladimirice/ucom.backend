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

  async getAndProcessMyselfBlockchainTransactions() {
    const accountName = this.currentUser.user.account_name;
    const data = await BlockchainTrTracesFetchService.getAndProcessOneUserTraces(accountName);

    // TODO - pagination related task
    const metadata = {
      page: 1,
      per_page: 100,
      has_more: false,
      total_amount: data.length,
    };

    return {
      data,
      metadata,
    }
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