"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropsUsersToReceivedService = require("../../airdrops/service/status-changer/airdrops-users-to-received-service");
const WorkerHelper = require("../../common/helper/worker-helper");
const EosApi = require('../../eos/eosApi');
const options = {
    processName: 'airdrops-users-to-received',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    const airdropId = 1;
    await AirdropsUsersToReceivedService.process(airdropId);
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
