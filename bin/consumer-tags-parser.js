"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consumer = require('../lib/tags/job/consumer-tags-parser');
(async () => {
    const res = await consumer.consume();
    console.log(`Consumer tags parser is started. Response from start is ${JSON.stringify(res, null, 2)}`);
})();
