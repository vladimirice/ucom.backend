"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropsUsersToReceivedService = require("../../lib/airdrops/service/status-changer/airdrops-users-to-received-service");
const WorkerHelper = require("../../lib/common/helper/worker-helper");
// @ts-ignore
const EosApi = require('../../lib/eos/eosApi');
const options = {
    processName: 'airdrops_users_to_received',
    durationInSecondsToAlert: 60,
};
async function toExecute() {
    // EosApi.initWalletApi(); // by design
    const airdropId = 1;
    await AirdropsUsersToReceivedService.process(airdropId);
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
