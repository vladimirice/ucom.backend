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
    await AirdropsUsersToReceivedService.processAllAirdrops();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
