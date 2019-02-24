"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eosImportance = require('../lib/eos/eos-importance');
const eosApi = require('../lib/eos/eosApi');
const { WorkerLogger } = require('../config/winston');
eosApi.initTransactionFactory();
// eslint-disable-next-line promise/always-return
eosImportance.updateRatesByBlockchain().then(() => {
    console.log('Job is finished');
}).catch((err) => {
    WorkerLogger.error(err);
    console.error('There is an error. See logs');
});
