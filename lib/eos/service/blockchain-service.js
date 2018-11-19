const BlockchainCacheService  = require('./blockchain-cache-service');
const BlockchainApiFetchService    = require('./blockchain-api-fetch-service');

class BlockchainService {
  /**
   *
   * @param {Object} currentUser
   */
  constructor(currentUser) {
    this.currentUser = currentUser;
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