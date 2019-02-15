"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const EntityCalculationService = require("../lib/stats/service/entity-calculation-service");
(async () => {
    console.log('Lets run the worker');
    const startTime = process.hrtime();
    await EntityCalculationService.updateEntitiesDeltas();
    const endTime = process.hrtime(startTime);
    console.log(`Worker has finished its work. Execution time: ${endTime[1] / 1000000} ms`);
})();
