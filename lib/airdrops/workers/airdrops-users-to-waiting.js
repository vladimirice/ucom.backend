"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropsUsersToWaitingService = require("../service/status-changer/airdrops-users-to-waiting-service");
const WorkerHelper = require("../../common/helper/worker-helper");
const EosApi = require('../../eos/eosApi');
const options = {
    processName: 'airdrops-users-to-waiting',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    await AirdropsUsersToWaitingService.process(100);
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
