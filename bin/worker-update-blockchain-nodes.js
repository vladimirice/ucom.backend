const BlockchainService = require('../lib/eos/service').Blockchain;
const { WalletApi }     = require('uos-app-wallet');

const { WorkerLogger } = require('../config/winston');

switch (process.env.NODE_ENV) {
  case 'test':
    WalletApi.initForTestEnv();
    break;
  case 'staging':
    WalletApi.initForStagingEnv();
    break;
  case 'production':
    WalletApi.initForProductionEnv();
    break;
  default:
    throw new Error(`Unknown environment ${process.env.NODE_ENV}`);
}

BlockchainService.updateBlockchainNodesByBlockchain().then(() => {
  console.log('Promise is resolved');
}).catch(err => {
  WorkerLogger.error(err);
  console.error('There is an error. See logs');
});
