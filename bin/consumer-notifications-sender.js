"use strict";
/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */
Object.defineProperty(exports, "__esModule", { value: true });
const consumer = require('../lib/entities/job').NotificationsConsumer;
// eslint-disable-next-line promise/always-return
consumer.consume().then(() => {
    console.log('Notifications consumer is started');
}).catch(() => {
    console.error('An error is occurred. See logs');
    process.exit(1);
});
