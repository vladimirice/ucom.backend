const blockchainCacheService          = require('./blockchain-cache-service');
const blockchainApiFetchService       = require('./blockchain-api-fetch-service');
const blockchainTrTracesFetchService  =
  require('./tr-traces-service/blockchain-tr-traces-fetch-service');

class BlockchainService {
  private currentUser;

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

    return await blockchainTrTracesFetchService.getAndProcessOneUserTraces(query, accountName);
  }

  /**
   * API method
   * @return {Object}
   */
  async getAndProcessNodes(query) {
    const userId = this.currentUser.id;

    return await blockchainApiFetchService.getAndProcessNodes(query, userId);
  }

  static async updateBlockchainNodesByBlockchain() {
    return await blockchainCacheService.updateBlockchainNodesByBlockchain();
  }
}

export = BlockchainService;
