import { AirdropsUserToChangeStatusDto } from '../../interfaces/dto-interfaces';

import AirdropsUsersRepository = require('../../repository/airdrops-users-repository');
import LegacyAccountNamesDictionary = require('../../../users/dictionary/legacy-account-names-dictionary');
import AirdropsTransactionsSender = require('../blockchain/airdrops-transactions-sender');

// @ts-ignore
const { BackendApi, WalletApi } = require('ucom-libs-wallet');

class AirdropsUsersToWaitingService {
  public static async process(limit: number) {
    // TODO - init for required env

    // TODO - airdrop should be composed by symbol_id + airdrop_id
    // @ts-ignore
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
        // @ts-ignore
        const dsddsb = 0;
      } catch (error) {

        // TODO - logging and continue
        // @ts-ignore
        const adsdds = 9;
      }
    }

    // @ts-ignore
    const bdsa = 0;

    /*

    create a single transaction-transfer for a given array record - 0.5
    ** Use mock method, do not use real sender


    wait until transaction status becomes success (trx id is received) - 0.5
    if an error is occurred - log it and continue processing - 0.5

    ------ error trx workflow ------

      This is a workflow related to trx sending error
    If an error is occurred and is related to nodejs - stop the worker
    If trx only - skip current user and continue to process next element
    1.5h
    ---- Successful trx workflow ------
      begin transaction

    write transaction to an outgoing_transactions_log - 0.5
    move funds from a reserved account to a waiting account and add transaction_id to appropriate field - 0.5
    change airdrops_users status from pending to waiting but do not change airdrops_users_external_data status - 0.25
    commit transaction
   */

    return null;
  }
}

export = AirdropsUsersToWaitingService;
