"use strict";
/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */
Object.defineProperty(exports, "__esModule", { value: true });
const EosApi = require("../eosApi");
const WorkerHelper = require("../../common/helper/worker-helper");
const EosImportance = require("../eos-importance");
EosApi.initBlockchainLibraries();
const options = {
    processName: 'update-importance',
    durationInSecondsToAlert: 220,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    await EosImportance.updateRatesByBlockchain();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
