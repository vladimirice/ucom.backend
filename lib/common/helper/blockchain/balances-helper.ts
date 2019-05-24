const { WalletApi } = require('ucom-libs-wallet');

class BalancesHelper {
  public static async printManyBalancesOfOneAccount(accountName: string, manySymbols: string[]): Promise<void> {
    for (const symbol of manySymbols) {
      const balance = await this.getOneBalanceInMajor(accountName, symbol);
      console.log(`${accountName} balance: ${balance} ${symbol}`);
    }
  }

  public static async getOneBalanceInMajor(accountName: string, symbol: string): Promise<number> {
    return WalletApi.getAccountBalance(accountName, symbol);
  }
}

export = BalancesHelper;
