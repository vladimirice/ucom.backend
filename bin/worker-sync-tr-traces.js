const BlockchainTrTracesService = require('../lib/eos/service/tr-traces-service/blockchain-tr-traces-service');

(async () => {
  await BlockchainTrTracesService.syncMongoDbAndPostgres();
  console.log('worker has finished all tasks');
})();
