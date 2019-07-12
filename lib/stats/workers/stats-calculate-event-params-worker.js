"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntityCalculationService = require("../service/entity-calculation-service");
const TotalDeltaCalculationService = require("../service/total-delta-calculation-service");
const EosApi = require("../../eos/eosApi");
const WorkerHelper = require("../../common/helper/worker-helper");
const options = {
    processName: 'stats-calculate-event-params',
    durationInSecondsToAlert: 60 * 20,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    await EntityCalculationService.updateEntitiesDeltas();
    console.log('Lets calculate total deltas');
    await TotalDeltaCalculationService.updateTotalDeltas();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
