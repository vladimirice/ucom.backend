const EosImportance = require('../lib/eos/eos-importance');

EosImportance.updateRatesByBlockchain().then(res => {
  console.log('Promise is resolved');
});
