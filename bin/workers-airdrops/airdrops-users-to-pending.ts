import { WorkerOptionsDto } from '../../lib/common/interfaces/options-dto';

import AirdropsUsersToPendingService = require('../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import WorkerHelper = require('../../lib/common/helper/worker-helper');

const options: WorkerOptionsDto = {
  processName: 'airdrops_users_to_pending',
  durationInSecondsToAlert: 60,
};

async function toExecute() {
  const airdropId = 1;
  await AirdropsUsersToPendingService.process(airdropId);
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
