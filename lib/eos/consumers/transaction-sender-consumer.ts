/* eslint-disable no-console */
import EosApi = require('../eosApi');
import BlockchainConsumer = require('../job/blockchain-consumer');
import DatetimeHelper = require('../../common/helper/datetime-helper');

EosApi.initBlockchainLibraries();

// eslint-disable-next-line promise/always-return
BlockchainConsumer.consume().then((res) => {
  console.log(`${DatetimeHelper.currentDatetime()}: Blockchain consumer is started. Response from start is ${res}`);
}).catch(() => {
  throw new Error('An error is occurred. See logs');
});

export {};
