import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import AirdropsUsersToReceivedService = require('../../airdrops/service/status-changer/airdrops-users-to-received-service');
import WorkerHelper = require('../../common/helper/worker-helper');

const EosApi = require('../../eos/eosApi');

const options: WorkerOptionsDto = {
  processName: 'airdrops-users-to-received',
  durationInSecondsToAlert: 50,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();

  const airdropId = 1;
  await AirdropsUsersToReceivedService.process(airdropId);
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
