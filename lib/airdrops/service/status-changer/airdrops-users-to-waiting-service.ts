import { AirdropsUserToChangeStatusDto } from '../../interfaces/dto-interfaces';

import AirdropsUsersRepository = require('../../repository/airdrops-users-repository');
import LegacyAccountNamesDictionary = require('../../../users/dictionary/legacy-account-names-dictionary');
import AirdropsTransactionsSender = require('../blockchain/airdrops-transactions-sender');
import { WorkerLogger } from '../../../../config/winston';

import ErrorEventToLogDto = require('../../../common/dto/error-event-to-log-dto');

// @ts-ignore
const { BackendApi, WalletApi } = require('ucom-libs-wallet');

class AirdropsUsersToWaitingService {
  public static async process(limit: number) {
    const usersToProcess: AirdropsUserToChangeStatusDto[] =
      await AirdropsUsersRepository.getDataForStatusToWaiting(limit);

    for (const item of usersToProcess) {
      if (LegacyAccountNamesDictionary.isAccountNameLegacy(item.account_name_to)) {
        continue;
      }

      // @ts-ignore
      let pushResponse;
      try {
        pushResponse = await AirdropsTransactionsSender.sendTransaction(item);

        /*
            ---- Successful trx workflow ------
          begin transaction

          write transaction to an outgoing_transactions_log - 0.5
          move funds from a reserved account to a waiting account and add transaction_id to appropriate field - 0.5
          change airdrops_users status from pending to waiting but do not change airdrops_users_external_data status - 0.25
          commit transaction
         */


      } catch (error) {
        const toLog = new ErrorEventToLogDto(
          'An error is occurred. Lets skip this item',
          item,
          error,
        );

        WorkerLogger.error(toLog);
      }
    }

    // @ts-ignore
    const bdsa = 0;

    /*

   */

    return null;
  }
}

export = AirdropsUsersToWaitingService;
