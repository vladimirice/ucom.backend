import { AppError } from '../../../lib/api/errors';

const accountsData = require('../../../../secrets/accounts-data');

class TransactionsHelper {
  public static getPrivateKey(accountIndex: string): string {
    if (accountsData[accountIndex]) {
      return accountsData[accountIndex].activePk;
    }

    throw new AppError(`There is no index ${accountIndex} inside accountsData`);
  }
}

export = TransactionsHelper;
