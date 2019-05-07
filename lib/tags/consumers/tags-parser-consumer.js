"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */
const DatetimeHelper = require("../../common/helper/datetime-helper");
const EosApi = require("../../eos/eosApi");
const ConsumerTagsParser = require("../job/consumer-tags-parser");
(async () => {
    EosApi.initBlockchainLibraries();
    const res = await ConsumerTagsParser.consume();
    console.log(`${DatetimeHelper.currentDatetime()}. Consumer tags parser is started. Response from start is ${JSON.stringify(res, null, 2)}`);
})();
