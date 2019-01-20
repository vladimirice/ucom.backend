/* eslint-disable no-console */
export {};

const blockchainTrTracesService = require('../lib/eos/service/tr-traces-service/blockchain-tr-traces-service');

(async () => {
  await blockchainTrTracesService.syncMongoDbAndPostgres();
  console.log('worker has finished all tasks');
})();
