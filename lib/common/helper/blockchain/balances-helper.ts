const { WalletApi } = require('ucom-libs-wallet');

class BalancesHelper {
  public static async printManyBalancesOfOneAccount(accountName: string, manySymbols: string[]): Promise<void> {
    for (const symbol of manySymbols) {
      const balance = await this.getOneBalanceInMajor(accountName, symbol);
      // eslint-disable-next-line no-console
      console.log(`${accountName} balance: ${balance} ${symbol}`);
    }
  }

  public static async getOneBalanceInMajor(accountName: string, symbol: string): Promise<number> {
    return WalletApi.getAccountBalance(accountName, symbol);
  }

  public static getTokensAmountFromString(stringValue: string, symbol: string): number {
    return +stringValue.replace(` ${symbol}`, '');
  }

  public static getTokensMajorOnlyAmountAsString(amount: number, symbol: string): string {
    return `${amount}.0000 ${symbol}`;
  }
}

export = BalancesHelper;
