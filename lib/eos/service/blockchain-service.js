"use strict";
const BlockchainCacheService = require("./blockchain-cache-service");
const BlockchainApiFetchService = require("./blockchain-api-fetch-service");
const blockchainTrTracesFetchService = require('./tr-traces-service/blockchain-tr-traces-fetch-service');
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
        return blockchainTrTracesFetchService.getAndProcessOneUserTraces(query, accountName);
    }
    /**
     * API method
     * @return {Object}
     */
    async getAndProcessNodes(query) {
        const userId = this.currentUser.id;
        return BlockchainApiFetchService.getAndProcessNodes(query, userId);
    }
    static async updateBlockchainNodesByBlockchain() {
        return BlockchainCacheService.updateBlockchainNodesByBlockchain();
    }
}
module.exports = BlockchainService;
