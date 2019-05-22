import { WorkerOptionsDto } from '../../common/interfaces/options-dto';
import { IAirdrop } from '../interfaces/model-interfaces';

import AirdropsUsersToPendingService = require('../service/status-changer/airdrops-users-to-pending-service');
import WorkerHelper = require('../../common/helper/worker-helper');
import EosApi = require('../../eos/eosApi');
import AirdropsFetchRepository = require('../repository/airdrops-fetch-repository');
import DatetimeHelper = require('../../common/helper/datetime-helper');

const options: WorkerOptionsDto = {
  processName: 'airdrops-users-to-pending',
  durationInSecondsToAlert: 50,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();

  const airdropIdToExclude = 1; // TODO - temp code for integration only

  const manyAirdrops: IAirdrop[] = await AirdropsFetchRepository.getAllAirdrops();
  for (const airdrop of manyAirdrops) {
    if (DatetimeHelper.isInProcess(airdrop.started_at, airdrop.finished_at)) {
      await AirdropsUsersToPendingService.process(airdrop.id, airdropIdToExclude);
    }
  }
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
