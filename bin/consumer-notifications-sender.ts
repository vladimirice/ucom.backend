/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */

import DatetimeHelper = require('../lib/common/helper/datetime-helper');

const consumer = require('../lib/entities/job').NotificationsConsumer;

// eslint-disable-next-line promise/always-return
consumer.consume().then(() => {
  console.log(`${DatetimeHelper.currentDatetime()} Notifications consumer is started`);
}).catch(() => {
  console.error(`${DatetimeHelper.currentDatetime()}. An error is occurred. See logs`);
  process.exit(1);
});

export {};
