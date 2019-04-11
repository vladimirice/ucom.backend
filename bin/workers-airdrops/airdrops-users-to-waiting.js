"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropsUsersToWaitingService = require("../../lib/airdrops/service/status-changer/airdrops-users-to-waiting-service");
const WorkerHelper = require("../../lib/common/helper/worker-helper");
const EosApi = require('../../lib/eos/eosApi');
const options = {
    processName: 'airdrops_users_to_waiting',
    durationInSecondsToAlert: 60,
};
async function toExecute() {
    EosApi.initWalletApi();
    await AirdropsUsersToWaitingService.process(100);
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
