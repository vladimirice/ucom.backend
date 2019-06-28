"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BalancesHelper = require("../../../lib/common/helper/blockchain/balances-helper");
const EosApi = require("../../../lib/eos/eosApi");
const yargs = require('yargs');
const argv = yargs
    .option('account_name', {
    alias: 'a',
    describe: 'account_name',
    type: 'string',
    demand: true,
})
    .option('symbol', {
    alias: 's',
    describe: 'symbol',
    type: 'string',
    demand: true,
    default: 'UOS',
})
    .help()
    .alias('help', 'h')
    .argv;
(async () => {
    EosApi.initBlockchainLibraries();
    const doesExist = await EosApi.doesAccountExist(argv.account_name);
    if (!doesExist) {
        console.error(`There is no such account: ${argv.account_name}`);
    }
    else {
        await BalancesHelper.printManyBalancesOfOneAccount(argv.account_name, [argv.symbol]);
    }
})();
