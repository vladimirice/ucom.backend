const BlockchainTrTracesService     = require('../lib/eos/service/blockchain-tr-traces-service');
const BlockchainTrTracesRepository  = require('../lib/eos/repository/blockchain-tr-traces-repository');

(async () => {
  await BlockchainTrTracesRepository.setSeqCurrentValByMaxNum();

  await BlockchainTrTracesService.syncMongoDbAndPostgres();

  console.log('worker had finished its work');
})();
