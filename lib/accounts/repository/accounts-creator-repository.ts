import { Transaction } from 'knex';

import AccountsModelProvider = require('../service/accounts-model-provider');

const ACCOUNTS_TRANSACTIONS = AccountsModelProvider.accountsTransactionsTableName();

class AccountsCreatorRepository {
  public static async createNewTransaction(
    jsonData: any,
    parentId: number | null,
    externalTrId: number | null,
    trx: Transaction,
  ): Promise<number> {
    const res = await trx(ACCOUNTS_TRANSACTIONS).insert({
      parent_id: parentId,
      external_tr_id: externalTrId,
      json_data: JSON.stringify(jsonData),
    }).returning(['id']);

    return +res[0].id;
  }
}

export = AccountsCreatorRepository;
