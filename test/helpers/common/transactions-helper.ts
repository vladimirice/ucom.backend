import { AppError } from '../../../lib/api/errors';

const accountsData = require('../../../../secrets/accounts-data');

class TransactionsHelper {
  public static getPrivateKey(accountIndex: string): string {
    if (accountsData[accountIndex]) {
      return accountsData[accountIndex].activePk;
    }

    throw new AppError(`There is no index ${accountIndex} inside accountsData`);
  }

  public static getSocialPrivateKey(accountIndex: string): string {
    if (!accountsData[accountIndex]) {
      throw new AppError(`There is no index ${accountIndex} inside accountsData`);
    }

    if (!accountsData[accountIndex].socialPrivateKey) {
      throw new AppError(`There is no activeSocialKey for ${accountIndex}`);
    }

    return accountsData[accountIndex].socialPrivateKey;
  }

  public static getSocialPermission(): string {
    return 'social';
  }
}

export = TransactionsHelper;
