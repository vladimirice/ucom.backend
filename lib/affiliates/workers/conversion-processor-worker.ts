import { WorkerOptionsDto } from '../../common/interfaces/options-dto';

import WorkerHelper = require('../../common/helper/worker-helper');
import RegistrationConversionProcessor = require('../service/conversions/registration-conversion-processor');

const options: WorkerOptionsDto = {
  processName: 'conversion-processor',
  durationInSecondsToAlert: 50,
};

async function toExecute() {
  return RegistrationConversionProcessor.process();
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
