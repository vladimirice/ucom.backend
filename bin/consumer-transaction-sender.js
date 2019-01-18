"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consumer = require('../lib/eos/job/blockchain-consumer');
consumer.consume().then((res) => {
    console.log(`Blockchain consumer is started. Response from start is ${res}`);
}).catch(() => {
    console.error('An error is occured. See logs');
    process.exit(1);
});
