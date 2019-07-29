"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
const MediaPostResendingService = require("../service/content-resending/media-post-resending-service");
const yargs = require('yargs');
const { argv } = yargs
    .option('limit', {
    describe: 'Number of users to process during the one run',
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
    const { createdAtLessOrEqualThan, limit, printPushResponse } = argv;
    const totalResponse = await MediaPostResendingService.resendMediaPosts(createdAtLessOrEqualThan, limit, printPushResponse);
    console.dir(totalResponse);
})();
