const EosImportance = require('../lib/eos/eos-importance');
const { EosApi } = require('../lib/eos/eosApi');

EosApi.initTransactionFactory();

EosImportance.updateRatesByBlockchain().then(() => {
  console.log('Promise is resolved');
});
