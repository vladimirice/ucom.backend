/* eslint-disable no-console */

import { WorkerOptionsDto } from '../../lib/common/interfaces/options-dto';

import AirdropsUsersToWaitingService = require('../../lib/airdrops/service/status-changer/airdrops-users-to-waiting-service');
import WorkerHelper = require('../../lib/common/helper/worker-helper');
const EosApi = require('../../lib/eos/eosApi');

const options: WorkerOptionsDto = {
  processName: 'airdrops_users_to_waiting',
  durationInSecondsToAlert: 60,
};

async function toExecute() {
  EosApi.initWalletApi();
  await AirdropsUsersToWaitingService.process(100);
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
