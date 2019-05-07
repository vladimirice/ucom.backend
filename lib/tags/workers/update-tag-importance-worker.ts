import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import EosApi = require('../../eos/eosApi');
import WorkerHelper = require('../../common/helper/worker-helper');
import TagsCurrentRateProcessor = require('../service/tags-current-rate-processor');

EosApi.initBlockchainLibraries();

const options: WorkerOptionsDto = {
  processName: 'update-tag-importance',
  durationInSecondsToAlert: 50,
};

async function toExecute() {
  EosApi.initBlockchainLibraries();

  TagsCurrentRateProcessor.process();
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
