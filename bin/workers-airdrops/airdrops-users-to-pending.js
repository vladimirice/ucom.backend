"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropsUsersToPendingService = require("../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service");
const AIRDROP_ID = 1;
(async () => {
    console.log('Lets run the worker');
    const startTime = process.hrtime();
    await AirdropsUsersToPendingService.process(AIRDROP_ID);
    const endTime = process.hrtime(startTime);
    console.log(`Worker has finished its work. Execution time is: ${endTime[1] / 1000000} ms`);
})();
