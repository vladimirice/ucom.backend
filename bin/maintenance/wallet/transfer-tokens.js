"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const { WalletApi, TransactionSender } = require('ucom-libs-wallet');
const EosApi = require('../../../lib/eos/eosApi');
async function printCurrentBalances(accountName, manySymbols) {
    for (const symbol of manySymbols) {
        const holderUosTestAfter = await WalletApi.getAccountBalance(accountName, symbol);
        console.log(`${accountName} balance: ${holderUosTestAfter} ${symbol}`);
    }
}
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
    await printCurrentBalances(accountNameFrom, manySymbols);
    await printCurrentBalances(accountNameTo, manySymbols);
    const amount = 1000000;
    await sendManyTokens(accountNameFrom, privateKey, accountNameTo, manySymbols, amount);
    await printCurrentBalances(accountNameFrom, manySymbols);
    await printCurrentBalances(accountNameTo, manySymbols);
})();
