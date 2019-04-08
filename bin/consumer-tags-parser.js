"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */
const DatetimeHelper = require("../lib/common/helper/datetime-helper");
const consumer = require('../lib/tags/job/consumer-tags-parser');
(async () => {
    const res = await consumer.consume();
    console.log(`${DatetimeHelper.currentDatetime()}. Consumer tags parser is started. Response from start is ${JSON.stringify(res, null, 2)}`);
})();
