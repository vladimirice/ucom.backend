/* eslint-disable no-console */
import EntityCalculationService = require('../lib/stats/service/entity-calculation-service');

(async () => {
  console.log('Lets run the worker');
  const startTime = process.hrtime();

  await EntityCalculationService.updateEntitiesDeltas();
  const endTime = process.hrtime(startTime);
  console.log(`Worker has finished its work. Execution time: ${endTime[1] / 1000000} ms`);
})();

export {};
