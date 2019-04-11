"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropsUsersToPendingService = require("../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service");
const WorkerHelper = require("../../lib/common/helper/worker-helper");
const options = {
    processName: 'airdrops_users_to_pending',
    durationInSecondsToAlert: 60,
};
async function toExecute() {
    const airdropId = 1;
    await AirdropsUsersToPendingService.process(airdropId);
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
