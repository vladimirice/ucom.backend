"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EosApi = require("../../eos/eosApi");
const WorkerHelper = require("../../common/helper/worker-helper");
const TagsCurrentRateProcessor = require("../service/tags-current-rate-processor");
EosApi.initBlockchainLibraries();
const options = {
    processName: 'update-tag-importance',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    await TagsCurrentRateProcessor.process();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
