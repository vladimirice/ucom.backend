const BlockchainTrTracesService = require('../lib/eos/service/blockchain-tr-traces-service');

(async () => {
  await BlockchainTrTracesService.syncMongoDbAndPostgres();
  console.log('worker had finished its work');
})();
