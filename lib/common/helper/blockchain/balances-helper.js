"use strict";
const { WalletApi } = require('ucom-libs-wallet');
class BalancesHelper {
    static async printManyBalancesOfOneAccount(accountName, manySymbols) {
        for (const symbol of manySymbols) {
            const balance = await this.getOneBalanceInMajor(accountName, symbol);
            console.log(`${accountName} balance: ${balance} ${symbol}`);
        }
    }
    static async getOneBalanceInMajor(accountName, symbol) {
        return WalletApi.getAccountBalance(accountName, symbol);
    }
}
module.exports = BalancesHelper;
