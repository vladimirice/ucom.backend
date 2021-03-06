import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import AirdropsUsersToPendingService = require('../service/status-changer/airdrops-users-to-pending-service');
import WorkerHelper = require('../../common/helper/worker-helper');
import EosApi = require('../../eos/eosApi');

const options: WorkerOptionsDto = {
  processName: 'airdrops-users-to-pending',
  durationInSecondsToAlert: 50,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();

  await AirdropsUsersToPendingService.processAllInProcessAirdrop();
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
