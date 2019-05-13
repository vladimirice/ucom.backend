import { Transaction } from 'knex';
import { AirdropDebtDto, FreshUserDto, TokensToClaim } from '../../interfaces/dto-interfaces';
import { AppError } from '../../../api/errors';
import { WorkerLogger } from '../../../../config/winston';

import AirdropsUsersExternalDataRepository = require('../../repository/airdrops-users-external-data-repository');
import AirdropsFetchRepository = require('../../repository/airdrops-fetch-repository');
import UsersActivityRepository = require('../../../users/repository/users-activity-repository');
import AirdropsTokensRepository = require('../../repository/airdrops-tokens-repository');
import AirdropUsersValidator = require('../../validator/airdrop-users-validator');
import knex = require('../../../../config/knex');
import AccountsCreatorService = require('../../../accounts/service/accounts-creator-service');
import AccountsTransactionsCreatorService = require('../../../accounts/service/accounts-transactions-creator-service');
import AirdropsUsersRepository = require('../../repository/airdrops-users-repository');

class AirdropsUsersToPendingService {
  public static async process(airdropId: number) {
    const manyFreshUsers: FreshUserDto[] =
      await AirdropsUsersExternalDataRepository.getManyUsersWithStatusNew(airdropId);

    if (manyFreshUsers.length === 0) {
      return;
    }

    const airdrop = await AirdropsFetchRepository.getAirdropByPk(airdropId);

    const usersToProcess: FreshUserDto[] = [];
    for (const freshUser of manyFreshUsers) {
      const isOk: boolean =
        await this.areAllConditionsFulfilledByUserId(freshUser.user_id, airdrop.conditions.community_id_to_follow);

      if (isOk) {
        usersToProcess.push(freshUser);
      }
    }

    if (usersToProcess.length === 0) {
      return;
    }

    const manyAirdropDebts: AirdropDebtDto[] = await AirdropsTokensRepository.getAirdropsAccountDataById(airdropId);

    for (const oneUser of usersToProcess) {
      AirdropUsersValidator.checkTokensConsistency(manyAirdropDebts, oneUser.json_data.tokens);
      await this.reserveAirdropForOneUser(airdropId, oneUser, manyAirdropDebts);
    }
  }

  private static async reserveAirdropForOneUser(
    airdropId: number,
    user: FreshUserDto,
    manyAirdropDebts: AirdropDebtDto[],
  ) {
    await knex.transaction(async (trx) => {
      for (const airdropDebt of manyAirdropDebts) {
        const userTokenData = user.json_data.tokens.find(item => item.symbol === airdropDebt.symbol);

        if (!userTokenData || userTokenData.amount_claim < 0) {
          throw new AppError(`Malformed amount for symbol ${airdropDebt.symbol}`, 500);
        }

        if (userTokenData.amount_claim === 0) {
          await AirdropsUsersExternalDataRepository.changeStatusToNoParticipation(user.users_external_id, trx);

          WorkerLogger.info(`There is no tokens with symbol ${airdropDebt.symbol} for user with ID: ${user.user_id}`);
          continue;
        }

        const tokenToClaim = {
          symbol_id:  airdropDebt.symbol_id,
          amount:     userTokenData.amount_claim,
        };

        await this.createAccountsAndTrxForToken(
          airdropId,
          user.user_id,
          airdropDebt.debt_account_id,
          tokenToClaim,
          trx,
        );

        await AirdropsUsersExternalDataRepository.changeStatusToPending(user.users_external_id, trx);
      }
    });
  }

  private static async areAllConditionsFulfilledByUserId(userId: number, orgId: number) {
    // Auth and external data are already checked by first DB request

    return UsersActivityRepository.doesUserFollowOrg(userId, orgId);
  }

  private static async createAccountsAndTrxForToken(
    airdropId: number,
    userId: number,
    debtAccountId: number,
    token: TokensToClaim,
    trx: Transaction,
  ): Promise<void> {
    const reservedAccountId: number =
      await AccountsCreatorService.createNewReservedAccount(token.symbol_id, userId, trx);
    const waitingAccountId =
      await AccountsCreatorService.createNewWaitingAccount(token.symbol_id, userId, trx);
    const walletAccountId =
      await AccountsCreatorService.createNewWalletAccount(token.symbol_id, userId, trx);

    await AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(
      debtAccountId,
      reservedAccountId,
      token.amount,
      trx,
    );

    await AirdropsUsersRepository.insertNewRecord(
      userId,
      airdropId,
      reservedAccountId,
      waitingAccountId,
      walletAccountId,
      trx,
    );
  }
}

export = AirdropsUsersToPendingService;
