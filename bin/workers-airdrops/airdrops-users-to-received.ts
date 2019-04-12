import { WorkerOptionsDto } from '../../lib/common/interfaces/options-dto';

import AirdropsUsersToReceivedService = require('../../lib/airdrops/service/status-changer/airdrops-users-to-received-service');
import WorkerHelper = require('../../lib/common/helper/worker-helper');

const EosApi = require('../../lib/eos/eosApi');

const options: WorkerOptionsDto = {
  processName: 'airdrops_users_to_received',
  durationInSecondsToAlert: 60,
};

async function toExecute() {
  EosApi.initWalletApi();

  const airdropId = 1;
  await AirdropsUsersToReceivedService.process(airdropId);
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
