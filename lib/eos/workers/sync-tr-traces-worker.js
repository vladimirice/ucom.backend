"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EosApi = require("../../eos/eosApi");
const BlockchainTrTracesService = require("../service/tr-traces-service/blockchain-tr-traces-service");
const WorkerHelper = require("../../common/helper/worker-helper");
const options = {
    processName: 'sync-tr-traces',
    durationInSecondsToAlert: 3200,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    await BlockchainTrTracesService.syncMongoDbAndPostgres();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
