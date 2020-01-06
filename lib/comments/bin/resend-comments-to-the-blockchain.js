"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
const CommentsResendingService = require("../service/content-resending/comments-resending-service");
const yargs = require('yargs');
const { argv } = yargs
    .option('limit', {
    describe: 'Number of users to process during the one run',
    type: 'number',
    demand: true,
})
    .option('offset', {
    describe: 'offset',
    type: 'number',
    demand: true,
})
    .option('createdAtLessOrEqualThan', {
    describe: 'createdAtLessOrEqualThan',
    type: 'string',
    demand: true,
})
    .option('printPushResponse', {
    describe: 'printPushResponse',
    type: 'boolean',
    demand: true,
})
    .help()
    .alias('help', 'h');
(async () => {
    const { createdAtLessOrEqualThan, limit, printPushResponse, offset, } = argv;
    const totalResponse = await CommentsResendingService.resendComments(createdAtLessOrEqualThan, limit, printPushResponse, offset);
    console.dir(totalResponse);
})();