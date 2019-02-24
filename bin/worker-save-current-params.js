"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const entity_job_executor_service_1 = require("../lib/stats/service/entity-job-executor-service");
(async () => {
    const startTime = process.hrtime();
    console.log('Lets save current params');
    await entity_job_executor_service_1.EntityJobExecutorService.processEntityEventParam();
    const endTime = process.hrtime(startTime);
    console.log(`Params are saved. Time: ${endTime[1] / 1000000} ms`);
})();
