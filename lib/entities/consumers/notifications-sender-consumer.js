"use strict";
/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */
Object.defineProperty(exports, "__esModule", { value: true });
const DatetimeHelper = require("../../common/helper/datetime-helper");
const NotificationsConsumer = require("../../entities/job/notifications-consumer");
const EosApi = require("../../eos/eosApi");
EosApi.initBlockchainLibraries();
// eslint-disable-next-line promise/always-return
NotificationsConsumer.consume().then(() => {
    console.log(`${DatetimeHelper.currentDatetime()} Notifications consumer is started`);
}).catch(() => {
    console.error(`${DatetimeHelper.currentDatetime()}. An error is occurred. See logs`);
    process.exit(1);
});
