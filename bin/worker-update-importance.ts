/* eslint-disable */
export {};

const eosImportance = require('../lib/eos/eos-importance');
const eosApi = require('../lib/eos/eosApi');

const { WorkerLogger } = require('../config/winston');

eosApi.initTransactionFactory();

const doWriteEventType: number = +(process.env.DO_WRITE_EVENT_TYPE || 2);

// eslint-disable-next-line promise/always-return
eosImportance.updateRatesByBlockchain(doWriteEventType).then(() => {
  console.log('Job is finished');
}).catch((err) => {
  WorkerLogger.error(err);
  console.error('There is an error. See logs');
});
