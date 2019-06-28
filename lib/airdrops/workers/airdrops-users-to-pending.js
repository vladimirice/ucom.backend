"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropsUsersToPendingService = require("../service/status-changer/airdrops-users-to-pending-service");
const WorkerHelper = require("../../common/helper/worker-helper");
const EosApi = require("../../eos/eosApi");
const options = {
    processName: 'airdrops-users-to-pending',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    await AirdropsUsersToPendingService.processAllInProcessAirdrop();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
