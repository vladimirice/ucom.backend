/* eslint-disable no-console */
import { EntityJobExecutorService } from '../service/entity-job-executor-service';
import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import EntityTotalsCalculator = require('../service/entity-totals-calculator');
import EosApi = require('../../eos/eosApi');
import WorkerHelper = require('../../common/helper/worker-helper');

const options: WorkerOptionsDto = {
  processName: 'worker-save-current-params',
  durationInSecondsToAlert: 50,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();

  console.log('Lets save current params');
  await EntityJobExecutorService.processEntityEventParam();

  console.log("Then let's save total params");
  await EntityTotalsCalculator.calculate();
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
