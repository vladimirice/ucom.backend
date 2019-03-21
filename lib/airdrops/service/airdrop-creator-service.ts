// @ts-ignore
import { Transaction } from 'knex';

import knex = require('../../../config/knex');
import AccountsTransactionsCreatorService = require('../../accounts/service/accounts-transactions-creator-service');
import AccountsCreatorService = require('../../accounts/service/accounts-creator-service');
import AirdropsCreatorRepository = require('../repository/airdrops-creator-repository');

const {AirdropStatuses} = require('ucom.libs.common').Airdrop.Dictionary;

// @ts-ignore
const AIRDROPS_TOKENS = 'airdrops_tokens';
// @ts-ignore
const AIRDROPS_USERS = 'airdrops_users';

// @ts-ignore
const ACCOUNTS_TRANSACTIONS_PARTS = 'accounts_transactions_parts';
// @ts-ignore
const ACCOUNTS_TRANSACTIONS = 'accounts_transactions';

interface TokensToClaim {
  symbol_id: number,
  amount: number,
}

class AirdropCreatorService {
  public static async createNewAirdrop(
    title: string,
    postId: number,
    conditions: any,
    startedAt: string,
    finishedAt: string,

    tokens: TokensToClaim[],
  ) {
    await knex.transaction(async (trx) => {
      const airdropId: number =
        await AirdropsCreatorRepository.createNewAirdrop(
          title,
          postId,
          conditions,
          startedAt,
          finishedAt,
          trx,
        );

      for (const token of tokens) {
        await this.createAccountsAndTrxForToken(token, airdropId, trx);
      }
    });
  }

  private static async createAccountsAndTrxForToken(
    token: TokensToClaim,
    airdropId: number,
    trx: Transaction,
  ): Promise<void> {
    const incomeAccountId: number =
      await AccountsCreatorService.createNewIncomeAccount(token.symbol_id, trx);
    const debtAccountId: number =
      await AccountsCreatorService.createNewDebtAccount(token.symbol_id, trx);

    await AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(
      incomeAccountId,
      debtAccountId,
      token.amount,
      trx,
    );

    await trx(AIRDROPS_TOKENS).insert({
      airdrop_id: airdropId,
      income_account_id: incomeAccountId,
      debt_account_id: debtAccountId,
      status: AirdropStatuses.NEW,
    });
  }
}

export = AirdropCreatorService;
