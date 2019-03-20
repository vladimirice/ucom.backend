import { Transaction } from 'knex';

import AccountsCreatorRepository = require('../accounts-creator-repository');

// @ts-ignore
const ACCOUNTS = 'accounts';

// @ts-ignore
const AIRDROPS = 'airdrops';
// @ts-ignore
const AIRDROPS_TOKENS = 'airdrops_tokens';
// @ts-ignore
const AIRDROPS_USERS = 'airdrops_users';

// @ts-ignore
const ACCOUNTS_TRANSACTIONS_PARTS = 'accounts_transactions_parts';

class AccountsTransactionsCreatorService {
  public static async createTrxBetweenTwoAccounts(
    accountIdFrom: number,
    accountIdTo: number,
    amount: number,
    trx: Transaction,
    parentTrxId: number | null = null,
    jsonData: any = {},
  ) {
    const transactionId: number = await AccountsCreatorRepository.createNewTransaction(
      jsonData,
      parentTrxId,
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
    await trx(ACCOUNTS)
      .where({id: accountIdFrom})
      .update({
        last_transaction_id: transactionId,
      })
      .decrement('current_balance', amount)
    ;

    // TO - update
    await trx(ACCOUNTS)
      .where({id: accountIdTo})
      .update({
        last_transaction_id: transactionId,
      })
      .increment('current_balance', amount)
    ;
  }
}

export = AccountsTransactionsCreatorService;
