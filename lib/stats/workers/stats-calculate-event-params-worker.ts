/* eslint-disable no-console */
import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import EntityCalculationService = require('../service/entity-calculation-service');
import TotalDeltaCalculationService = require('../service/total-delta-calculation-service');

import EosApi = require('../../eos/eosApi');
import WorkerHelper = require('../../common/helper/worker-helper');

const options: WorkerOptionsDto = {
  processName: 'stats-calculate-event-params',
  durationInSecondsToAlert: 600,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();

  await EntityCalculationService.updateEntitiesDeltas();
  await TotalDeltaCalculationService.updateTotalDeltas();
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
