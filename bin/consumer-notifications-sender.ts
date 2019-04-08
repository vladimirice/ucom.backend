/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */

const consumer = require('../lib/entities/job').NotificationsConsumer;

// eslint-disable-next-line promise/always-return
consumer.consume().then(() => {
  console.log('Notifications consumer is started');
}).catch(() => {
  console.error('An error is occurred. See logs');
  process.exit(1);
});

export {};
