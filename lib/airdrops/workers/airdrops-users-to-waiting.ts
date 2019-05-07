/* eslint-disable no-console */

import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import AirdropsUsersToWaitingService = require('../service/status-changer/airdrops-users-to-waiting-service');
import WorkerHelper = require('../../common/helper/worker-helper');
const EosApi = require('../../eos/eosApi');

const options: WorkerOptionsDto = {
  processName: 'airdrops-users-to-waiting',
  durationInSecondsToAlert: 50,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();
  await AirdropsUsersToWaitingService.process(100);
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
