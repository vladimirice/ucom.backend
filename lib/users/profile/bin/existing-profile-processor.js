"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const ExistingProfilesProcessor = require("../service/existing-profiles-processor");
const yargs = require('yargs');
const { argv } = yargs
    .option('limit', {
    describe: 'Number of users to process during the one run',
    type: 'number',
    demand: true,
})
    .help()
    .alias('help', 'h');
(async () => {
    const { limit } = argv;
    const totalResponse = await ExistingProfilesProcessor.process(limit);
    console.dir(totalResponse);
})();
