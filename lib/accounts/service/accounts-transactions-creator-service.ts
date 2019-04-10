import { Transaction } from 'knex';
import { AppError } from '../../api/errors';

import AccountsCreatorRepository = require('../repository/accounts-creator-repository');
import AccountsRepository = require('../repository/accounts-repository');

// @ts-ignore
const ACCOUNTS = 'accounts';

// @ts-ignore
const ACCOUNTS_TRANSACTIONS_PARTS = 'accounts_transactions_parts';

class AccountsTransactionsCreatorService {
  public static async createTrxBetweenTwoAccounts(
    accountIdFrom: number,
    accountIdTo: number,
    amount: number,
    trx: Transaction,
    allowNegativeFrom: boolean = false,
    parentTrxId: number | null = null,
    jsonData: any = {},
    externalTrId: number | null = null,
  ) {
    const areSymbolsEqual =
      await AccountsRepository.areSymbolsEqual([accountIdFrom, accountIdTo], trx);
    if (!areSymbolsEqual) {
      throw new AppError(
        `It is not possible to transfer between accounts of different symbols. Account Id from: ${accountIdFrom}, account ID to: ${accountIdTo}`,
        500,
      );
    }

    const transactionId: number = await AccountsCreatorRepository.createNewTransaction(
      jsonData,
      parentTrxId,
      externalTrId,
      trx,
    );

    // FROM - negative
    await trx(ACCOUNTS_TRANSACTIONS_PARTS).insert({
      transaction_id: transactionId,
      account_id: accountIdFrom,
      amount: -amount,
    });

    // TO - positive
    await trx(ACCOUNTS_TRANSACTIONS_PARTS).insert({
      transaction_id: transactionId,
      account_id: accountIdTo,
      amount,
    });

    // FROM - update
    const newBalanceFrom = await trx(ACCOUNTS)
      .where({ id: accountIdFrom })
      .update({
        last_transaction_id: transactionId,
      })
      .decrement('current_balance', amount)
      .returning('current_balance')
    ;

    // TO - update
    await trx(ACCOUNTS)
      .where({ id: accountIdTo })
      .update({
        last_transaction_id: transactionId,
      })
      .increment('current_balance', amount)
      .returning('current_balance')
    ;

    if (!allowNegativeFrom && +newBalanceFrom < 0) {
      throw new AppError(`Current balance of account from after transaction becomes negative. Account Id from: ${accountIdFrom}, account ID to: ${accountIdTo}`, 500);
    }
  }
}

export = AccountsTransactionsCreatorService;
