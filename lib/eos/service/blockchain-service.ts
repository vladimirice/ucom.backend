import BlockchainCacheService = require('../../blockchain-nodes/service/blockchain-cache-service');
import BlockchainApiFetchService = require('../../blockchain-nodes/service/blockchain-api-fetch-service');

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

    return blockchainTrTracesFetchService.getAndProcessOneUserTraces(query, accountName);
  }

  /**
   * API method
   * @return {Object}
   */
  async getAndProcessNodes(query) {
    const userId = this.currentUser.id;

    return BlockchainApiFetchService.getAndProcessNodesLegacy(query, userId);
  }

  public static async updateBlockchainNodesByBlockchain() {
    return BlockchainCacheService.updateBlockchainNodesByBlockchain();
  }
}

export = BlockchainService;
