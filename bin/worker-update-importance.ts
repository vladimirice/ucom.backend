/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */

const eosImportance = require('../lib/eos/eos-importance');
const eosApi = require('../lib/eos/eosApi');

const { WorkerLogger } = require('../config/winston');

eosApi.initTransactionFactory();

// eslint-disable-next-line promise/always-return
eosImportance.updateRatesByBlockchain().then(() => {
  console.log('Job is finished');
}).catch((error) => {
  WorkerLogger.error(error);
  console.error('There is an error. See logs');
});

export {};
