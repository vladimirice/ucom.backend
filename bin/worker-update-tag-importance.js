"use strict";
/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */
Object.defineProperty(exports, "__esModule", { value: true });
const processor = require('../lib/tags/service/tags-current-rate-processor');
const { WorkerLogger } = require('../config/winston');
processor.process()
    // eslint-disable-next-line promise/always-return
    .then(() => {
    console.log('Job is finished');
}).catch((error) => {
    WorkerLogger.error(error);
    console.error('There is an error. See logs');
});
