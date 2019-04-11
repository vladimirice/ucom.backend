/* eslint-disable no-console */
import { AirdropsUserToChangeStatusDto } from '../../interfaces/dto-interfaces';
import { WorkerLogger } from '../../../../config/winston';

import AirdropsUsersRepository = require('../../repository/airdrops-users-repository');
import LegacyAccountNamesDictionary = require('../../../users/dictionary/legacy-account-names-dictionary');
import AirdropsTransactionsSender = require('../blockchain/airdrops-transactions-sender');

import ErrorEventToLogDto = require('../../../common/dto/error-event-to-log-dto');
import knex = require('../../../../config/knex');
import OutgoingTransactionsLogRepository = require('../../../eos/repository/outgoing-transactions-log-repository');
import EosBlockchainStatusDictionary = require('../../../eos/eos-blockchain-status-dictionary');
import AccountsTransactionsCreatorService = require('../../../accounts/service/accounts-transactions-creator-service');

class AirdropsUsersToWaitingService {
  public static async process(
    limit: number,
  ): Promise<{ processedCounter }> {
    let processedCounter = 0;
    const usersToProcess: AirdropsUserToChangeStatusDto[]  =
      await AirdropsUsersRepository.getDataForStatusToWaiting(limit);

    console.log(`Airdrops users rows to process: ${usersToProcess.length}`);

    for (const item of usersToProcess) {
      await this.processOneItem(item);
      processedCounter += 1;
    }

    console.log(`Processed counter value: ${processedCounter}`);

    return {
      processedCounter,
    };
  }

  private static async processOneItem(item: AirdropsUserToChangeStatusDto) {
    if (LegacyAccountNamesDictionary.isAccountNameLegacy(item.account_name_to)) {
      return;
    }

    try {
      const { signedPayload, pushingResponse } = await AirdropsTransactionsSender.sendTransaction(item);

      await knex.transaction(async (trx) => {
        const externalTrId = await OutgoingTransactionsLogRepository.insertOneRow(
          pushingResponse.transaction_id,
          signedPayload,
          pushingResponse,
          EosBlockchainStatusDictionary.getStatusIsSent(),
          trx,
        );

        await Promise.all([
          AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(
            item.account_id_from,
            item.account_id_to,
            item.amount,
            trx,
            false,
            null,
            {},
            externalTrId,
          ),
          AirdropsUsersRepository.setStatusWaiting(item.id, trx),
        ]);
      });
    } catch (error) {
      const toLog = new ErrorEventToLogDto(
        'An error is occurred. Lets skip this item',
        item,
        error,
      );

      WorkerLogger.error(toLog);
    }
  }
}

export = AirdropsUsersToWaitingService;
