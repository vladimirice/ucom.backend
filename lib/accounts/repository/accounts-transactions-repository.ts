import knex = require('../../../config/knex');
import AccountsModelProvider = require('../service/accounts-model-provider');

const TABLE_NAME = AccountsModelProvider.accountsTransactionsTableName();

class AccountsTransactionsRepository {
  public static async findOneById(id: number): Promise<any> {
    return knex(TABLE_NAME)
      .where('id', '=', id)
      .first();
  }
}

export = AccountsTransactionsRepository;
