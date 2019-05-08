/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */

import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import EosApi = require('../eosApi');
import WorkerHelper = require('../../common/helper/worker-helper');
import EosImportance = require('../eos-importance');

EosApi.initBlockchainLibraries();

const options: WorkerOptionsDto = {
  processName: 'update-importance',
  durationInSecondsToAlert: 120,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();

  await EosImportance.updateRatesByBlockchain();
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
