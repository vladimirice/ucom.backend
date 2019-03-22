import { Transaction } from 'knex';

const ACCOUNTS_TRANSACTIONS = 'accounts_transactions';

class AccountsCreatorRepository {
  public static async createNewTransaction(
    jsonData: any,
    parentId: number | null,
    trx: Transaction,
  ): Promise<number> {
    const res = await trx(ACCOUNTS_TRANSACTIONS).insert({
      parent_id: parentId,
      json_data: JSON.stringify(jsonData),
    }).returning(['id']);

    return +res[0].id;
  }
}

export = AccountsCreatorRepository;
