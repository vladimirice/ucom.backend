import { AccountsSymbolsModel } from '../interfaces/accounts-model-interfaces';

import AccountsModelProvider = require('../service/accounts-model-provider');
import knex = require('../../../config/knex');

const TABLE_NAME = AccountsModelProvider.accountsSymbolsTableName();
class AccountsSymbolsRepository {
  public static async findAllAccountsSymbols(): Promise<AccountsSymbolsModel[]> {
    return knex(TABLE_NAME);
  }
}

export = AccountsSymbolsRepository;
