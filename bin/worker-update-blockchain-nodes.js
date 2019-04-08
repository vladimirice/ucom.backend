"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { WalletApi } = require('ucom-libs-wallet');
const blockchainService = require('../lib/eos/service').Blockchain;
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
// eslint-disable-next-line promise/always-return
blockchainService.updateBlockchainNodesByBlockchain().then(() => {
    console.log('Promise is resolved');
}).catch((error) => {
    WorkerLogger.error(error);
    console.error('There is an error. See logs');
});
