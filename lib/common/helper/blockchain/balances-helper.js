"use strict";
const { WalletApi } = require('ucom-libs-wallet');
class BalancesHelper {
    static async printManyBalancesOfOneAccount(accountName, manySymbols) {
        for (const symbol of manySymbols) {
            const balance = await this.getOneBalanceInMajor(accountName, symbol);
            // eslint-disable-next-line no-console
            console.log(`${accountName} balance: ${balance} ${symbol}`);
        }
    }
    static async getOneBalanceInMajor(accountName, symbol) {
        return WalletApi.getAccountBalance(accountName, symbol);
    }
    static getTokensAmountFromString(stringValue, symbol) {
        return +stringValue.replace(` ${symbol}`, '');
    }
    static getTokensMajorOnlyAmountAsString(amount, symbol) {
        return `${amount}.0000 ${symbol}`;
    }
}
module.exports = BalancesHelper;
