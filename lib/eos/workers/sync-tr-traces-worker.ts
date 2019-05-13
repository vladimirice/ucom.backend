import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import EosApi = require('../../eos/eosApi');
import BlockchainTrTracesService = require('../service/tr-traces-service/blockchain-tr-traces-service');
import WorkerHelper = require('../../common/helper/worker-helper');

const options: WorkerOptionsDto = {
  processName: 'sync-tr-traces',
  durationInSecondsToAlert: 3200,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();

  await BlockchainTrTracesService.syncMongoDbAndPostgres();
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
