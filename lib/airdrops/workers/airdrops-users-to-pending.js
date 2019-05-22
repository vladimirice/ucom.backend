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
    const airdropId = 2; // TODO - fetch by the cycle
    const airdropIdToExclude = 1; // TODO - temp code for integration only
    // const manyAirdrops: IAirdrop[] = await AirdropsFetchRepository.getAllAirdrops();
    // for (const airdrop of manyAirdrops) {
    //   if (DatetimeHelper.isInProcess(airdrop.started_at, airdrop.finished_at)) {
    await AirdropsUsersToPendingService.process(airdropId, airdropIdToExclude);
    // }
    // }
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
