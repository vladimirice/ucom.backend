"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const entity_job_executor_service_1 = require("../service/entity-job-executor-service");
const EntityTotalsCalculator = require("../service/entity-totals-calculator");
const EosApi = require("../../eos/eosApi");
const WorkerHelper = require("../../common/helper/worker-helper");
const options = {
    processName: 'worker-save-current-params',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    EosApi.initBlockchainLibraries();
    console.log('Lets save current params');
    await entity_job_executor_service_1.EntityJobExecutorService.processEntityEventParam();
    console.log("Then let's save total params");
    await EntityTotalsCalculator.calculate();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
