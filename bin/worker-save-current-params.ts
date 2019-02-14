/* eslint-disable no-console */
import { EntityJobExecutorService } from '../lib/stats/service/entity-job-executor-service';

(async () => {
  const startTime = process.hrtime();

  console.log('Lets save current params');
  await EntityJobExecutorService.processEntityEventParam();

  const endTime = process.hrtime(startTime);
  console.log(`Params are saved. Time: ${endTime[1] / 1000000} ms`);
})();

export {};
