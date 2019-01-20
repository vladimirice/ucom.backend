"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consumer = require('../lib/eos/job/blockchain-consumer');
// eslint-disable-next-line promise/always-return
consumer.consume().then((res) => {
    console.log(`Blockchain consumer is started. Response from start is ${res}`);
}).catch(() => {
    throw new Error('An error is occured. See logs');
});
