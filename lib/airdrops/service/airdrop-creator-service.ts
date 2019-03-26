import { Transaction } from 'knex';
import { TokensToClaim } from '../interfaces/dto-interfaces';

import knex = require('../../../config/knex');
import AccountsTransactionsCreatorService = require('../../accounts/service/accounts-transactions-creator-service');
import AccountsCreatorService = require('../../accounts/service/accounts-creator-service');
import AirdropsCreatorRepository = require('../repository/airdrops-creator-repository');
import AirdropsTokensRepository = require('../repository/airdrops-tokens-repository');

class AirdropCreatorService {
  public static async createNewAirdrop(
    title: string,
    postId: number,
    conditions: any,
    startedAt: string,
    finishedAt: string,

    tokens: TokensToClaim[],
  ) {
    const { id: airdropId } = await knex.transaction(async (trx) => {
      const id =
        await AirdropsCreatorRepository.createNewAirdrop(
          title,
          postId,
          conditions,
          startedAt,
          finishedAt,
          trx,
        );

      for (const token of tokens) {
        await this.createAccountsAndTrxForToken(token, id, trx);
      }

      return { id };
    });

    return {
      airdropId,
    };
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
      true,
    );

    await AirdropsTokensRepository.insertNewRecord(airdropId, incomeAccountId, debtAccountId, trx);
  }
}

export = AirdropCreatorService;
