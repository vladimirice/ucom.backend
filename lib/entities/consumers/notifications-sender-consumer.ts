/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */

import DatetimeHelper = require('../../common/helper/datetime-helper');
import NotificationsConsumer = require('../../entities/job/notifications-consumer');
import EosApi = require('../../eos/eosApi');

EosApi.initBlockchainLibraries();

// eslint-disable-next-line promise/always-return
NotificationsConsumer.consume().then(() => {
  console.log(`${DatetimeHelper.currentDatetime()} Notifications consumer is started`);
}).catch(() => {
  console.error(`${DatetimeHelper.currentDatetime()}. An error is occurred. See logs`);
  process.exit(1);
});

export {};
