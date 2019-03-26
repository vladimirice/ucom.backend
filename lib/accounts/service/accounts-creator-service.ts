import { Transaction } from 'knex';

import AccountTypesDictionary = require('../dictionary/account-types-dictionary');

const ACCOUNTS_TABLE_NAME = 'accounts';

class AccountsCreatorService {
  public static async createNewReservedAccount(
    symbolId: number,
    userId: number,
    trx: Transaction,
  ): Promise<number> {
    return this.createNewAccount(
      AccountTypesDictionary.reserved(),
      symbolId,
      userId,
      trx,
    );
  }

  public static async createNewWaitingAccount(
    symbolId: number,
    userId: number,
    trx: Transaction,
  ): Promise<number> {
    return this.createNewAccount(
      AccountTypesDictionary.waiting(),
      symbolId,
      userId,
      trx,
    );
  }

  public static async createNewWalletAccount(
    symbolId: number,
    userId: number,
    trx: Transaction,
  ): Promise<number> {
    return this.createNewAccount(
      AccountTypesDictionary.wallet(),
      symbolId,
      userId,
      trx,
    );
  }

  public static async createNewIncomeAccount(symbolId: number, trx: Transaction): Promise<number> {
    return this.createNewAccount(
      AccountTypesDictionary.income(),
      symbolId,
      null,
      trx,
    );
  }

  public static async createNewDebtAccount(symbolId: number, trx: Transaction): Promise<number> {
    return this.createNewAccount(
      AccountTypesDictionary.debt(),
      symbolId,
      null,
      trx,
    );
  }

  private static async createNewAccount(
    accountType: number,
    symbolId: number,
    userId: number | null,
    trx: Transaction,
  ): Promise<number> {
    const res = await trx(ACCOUNTS_TABLE_NAME).insert({
      account_type: accountType,
      user_id: userId,
      symbol_id: symbolId,

      current_balance: 0,
      last_transaction_id: null,
    }).returning(['id']);

    return +res[0].id;
  }
}

export = AccountsCreatorService;
