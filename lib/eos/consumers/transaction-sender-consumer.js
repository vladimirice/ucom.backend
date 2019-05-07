"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const EosApi = require("../eosApi");
const BlockchainConsumer = require("../job/blockchain-consumer");
const DatetimeHelper = require("../../common/helper/datetime-helper");
EosApi.initBlockchainLibraries();
// eslint-disable-next-line promise/always-return
BlockchainConsumer.consume().then((res) => {
    console.log(`${DatetimeHelper.currentDatetime()}: Blockchain consumer is started. Response from start is ${res}`);
}).catch(() => {
    throw new Error('An error is occurred. See logs');
});
