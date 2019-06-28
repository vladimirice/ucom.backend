"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const BalancesHelper = require("../../../lib/common/helper/blockchain/balances-helper");
const { WalletApi, TransactionSender } = require('ucom-libs-wallet');
const EosApi = require('../../../lib/eos/eosApi');
async function sendManyTokens(accountNameFrom, privateKey, accountNameTo, manySymbols, amount) {
    for (const symbol of manySymbols) {
        await TransactionSender.sendTokens(accountNameFrom, privateKey, accountNameTo, amount, '', symbol);
    }
}
(async () => {
    const manySymbols = [
        'UOSF',
        'UOS',
    ];
    WalletApi.setNodeJsEnv();
    WalletApi.initForProductionEnv();
    const accountNameFrom = EosApi.getGithubAirdropHolderAccountName();
    const privateKey = EosApi.getGithubAirdropHolderActivePrivateKey();
    const accountNameTo = EosApi.getGithubAirdropAccountName();
    await BalancesHelper.printManyBalancesOfOneAccount(accountNameFrom, manySymbols);
    await BalancesHelper.printManyBalancesOfOneAccount(accountNameTo, manySymbols);
    const amount = 1000000;
    await sendManyTokens(accountNameFrom, privateKey, accountNameTo, manySymbols, amount);
    await BalancesHelper.printManyBalancesOfOneAccount(accountNameFrom, manySymbols);
    await BalancesHelper.printManyBalancesOfOneAccount(accountNameTo, manySymbols);
})();
