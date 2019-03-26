import { Transaction } from 'knex';

import AccountsModelProvider = require('../service/accounts-model-provider');

const TABLE_NAME = AccountsModelProvider.accountsTableName();

class AccountsRepository {
  public static async areSymbolsEqual(accountsIds: number[], trx: Transaction): Promise<boolean> {
    const data = await trx(TABLE_NAME)
      .select([
        'id',
        'symbol_id',
      ])
      .whereIn('id', accountsIds);

    const symbolToMatch = data[0].symbol_id;

    for (let i = 1; i < data.length; i += 1) {
      if (data[i].symbol_id !== symbolToMatch) {
        return false;
      }
    }

    return true;
  }
}

export = AccountsRepository;
