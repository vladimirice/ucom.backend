const EosImportance = require('../lib/eos/eos-importance');
const EosApi = require('../lib/eos/eosApi');

const { WorkerLogger } = require('../config/winston');
EosApi.initTransactionFactory();

EosImportance.updateRatesByBlockchain().then(() => {
  console.log('Job is finished');
}).catch(err => {
  WorkerLogger.error(err);
  console.error('There is an error. See logs');
});
