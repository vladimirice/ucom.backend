"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BlockchainCacheService = require("../../blockchain-nodes/service/blockchain-cache-service");
const WorkerHelper = require("../../common/helper/worker-helper");
const EosApi = require("../../eos/eosApi");
const options = {
    processName: 'update_blockchain_nodes',
    durationInSecondsToAlert: 60,
};
async function toExecute() {
    EosApi.initWalletApi();
    await BlockchainCacheService.updateBlockchainNodesByBlockchain();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
