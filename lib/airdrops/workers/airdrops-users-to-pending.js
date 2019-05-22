"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropsUsersToPendingService = require("../service/status-changer/airdrops-users-to-pending-service");
const WorkerHelper = require("../../common/helper/worker-helper");
const EosApi = require("../../eos/eosApi");
const AirdropsFetchRepository = require("../repository/airdrops-fetch-repository");
const DatetimeHelper = require("../../common/helper/datetime-helper");
const options = {
    processName: 'airdrops-users-to-pending',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    const manyAirdrops = await AirdropsFetchRepository.getAllAirdrops();
    for (const airdrop of manyAirdrops) {
        if (DatetimeHelper.isInProcess(airdrop.started_at, airdrop.finished_at)) {
            await AirdropsUsersToPendingService.process(airdrop.id);
        }
    }
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
