import { Transaction } from 'knex';
import { AirdropDebtDto } from '../interfaces/dto-interfaces';

import AirdropsModelProvider = require('../service/airdrops-model-provider');
import knex = require('../../../config/knex');
import AccountsModelProvider = require('../../accounts/service/accounts-model-provider');
import RepositoryHelper = require('../../common/repository/repository-helper');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

const TABLE_NAME = AirdropsModelProvider.airdropsTokensTableName();

class AirdropsTokensRepository {
  public static async insertNewRecord(
    airdropId: number,
    incomeAccountId: number,
    debtAccountId: number,
    trx: Transaction,
  ): Promise<void> {
    await trx(TABLE_NAME).insert({
      airdrop_id: airdropId,
      income_account_id: incomeAccountId,
      debt_account_id: debtAccountId,
      status: AirdropStatuses.NEW,
    });
  }

  public static async getAirdropsAccountDataById(airdropId: number): Promise<AirdropDebtDto[]> {
    const accounts: string = AccountsModelProvider.accountsTableName();
    const symbols: string = AccountsModelProvider.accountsSymbolsTableName();

    const data = await knex(TABLE_NAME)
      .select([
        `${accounts}.id AS debt_account_id`,
        `${accounts}.symbol_id AS symbol_id`,
        `${symbols}.title AS symbol`,
        `${accounts}.current_balance AS current_balance`,
      ])
      .innerJoin(`${accounts}`, `${accounts}.id`, `${TABLE_NAME}.debt_account_id`)
      .innerJoin(`${symbols}`, `${symbols}.id`, `${accounts}.symbol_id`)
      .where(`${TABLE_NAME}.airdrop_id`, airdropId);

    const numericalFields = [
      'debt_account_id',
      'current_balance',
    ];

    const fieldsToDisallowZero = [
      'debt_account_id',
      'current_balance',
    ];

    data.forEach((row) => {
      RepositoryHelper.convertStringFieldsToNumbers(row, numericalFields, fieldsToDisallowZero);
    });

    return data;
  }
}

export = AirdropsTokensRepository;
