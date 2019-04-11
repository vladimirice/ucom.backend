/* eslint-disable no-process-exit,unicorn/no-process-exit */
import MeasurementHelper = require('../../lib/common/helper/measurement-helper');
import AirdropsUsersToReceivedService = require('../../lib/airdrops/service/status-changer/airdrops-users-to-received-service');

const options = {
  processName: 'airdrops_users_to_received',
  durationInSecondsToAlert: 60,
};

(async () => {
  const m = MeasurementHelper.startWithMessage(options.processName);

  const airdropId = 1;
  await AirdropsUsersToReceivedService.process(airdropId);

  m.printWithDurationChecking(options.processName, options.durationInSecondsToAlert);

  process.exit(0);
})();

export {};
