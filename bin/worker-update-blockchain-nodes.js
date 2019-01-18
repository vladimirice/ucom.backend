"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blockchainService = require('../lib/eos/service').Blockchain;
const { WalletApi } = require('ucom-libs-wallet');
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
blockchainService.updateBlockchainNodesByBlockchain().then(() => {
    console.log('Promise is resolved');
}).catch((err) => {
    WorkerLogger.error(err);
    console.error('There is an error. See logs');
});
