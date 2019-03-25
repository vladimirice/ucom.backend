import { AccountsSymbolsModel } from '../interfaces/accounts-model-interfaces';
import { StringToNumberCollection } from '../../common/interfaces/common-types';

import AccountsModelProvider = require('../service/accounts-model-provider');
import knex = require('../../../config/knex');

const TABLE_NAME = AccountsModelProvider.accountsSymbolsTableName();
class AccountsSymbolsRepository {
  public static async findAllAccountsSymbols(): Promise<AccountsSymbolsModel[]> {
    return knex(TABLE_NAME);
  }
  
  public static async findAllAccountsSymbolsIndexedByTitle(): Promise<StringToNumberCollection> {
    const data = await this.findAllAccountsSymbols();

    const res: StringToNumberCollection = {};

    data.forEach((item) => {
      res[item.title] = +item.id;
    });

    return res;
  }
}

export = AccountsSymbolsRepository;
