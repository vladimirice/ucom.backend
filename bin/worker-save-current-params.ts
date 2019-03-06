/* eslint-disable no-console */
import { EntityJobExecutorService } from '../lib/stats/service/entity-job-executor-service';

import EntityTotalsCalculator = require('../lib/stats/service/entity-totals-calculator');

(async () => {
  const startTime = process.hrtime();

  console.log('Lets save current params');
  await EntityJobExecutorService.processEntityEventParam();

  const endTime = process.hrtime(startTime);
  console.log(`====== Params have been saved. Time: ${endTime[1] / 1000000} ms`);

  // ==========================================
  const totalsStartTime = process.hrtime();

  console.log("Then let's save total params");
  await EntityTotalsCalculator.calculate();

  const totalsEndTime = process.hrtime(totalsStartTime);
  console.log(`==== Total params have been saved. Time: ${totalsEndTime[1] / 1000000} ms`);
})();

export {};
