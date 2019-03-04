/* eslint-disable no-console */
import EntityCalculationService = require('../lib/stats/service/entity-calculation-service');
import TotalDeltaCalculationService = require('../lib/stats/service/total-delta-calculation-service');

(async () => {
  console.log('Lets run the worker');
  const startTime = process.hrtime();

  await EntityCalculationService.updateEntitiesDeltas();
  const endTime = process.hrtime(startTime);
  console.log(`Worker has finished its work. Execution time is: ${endTime[1] / 1000000} ms`);

  // =====================

  console.log("Let's run the total delta worker");
  const totalsStartTime = process.hrtime();

  await TotalDeltaCalculationService.updateTotalDeltas();
  const totalsEndTime = process.hrtime(totalsStartTime);
  console.log(`Worker has finished it's work. Execution time is: ${totalsEndTime[1] / 1000000} ms`);
})();

export {};
