/* eslint-disable no-console */
import { AirdropsReceiptTableRowsDto, AirdropsUserToChangeStatusDto } from '../../interfaces/dto-interfaces';

import AirdropsFetchTableRowsService = require('../blockchain/airdrops-fetch-table-rows-service');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import AirdropsUsersRepository = require('../../repository/airdrops-users-repository');
import knex = require('../../../../config/knex');
import AccountsTransactionsCreatorService = require('../../../accounts/service/accounts-transactions-creator-service');
import AirdropsTokensRepository = require('../../repository/airdrops-tokens-repository');
import AirdropsUsersExternalDataRepository = require('../../repository/airdrops-users-external-data-repository');
import { IAirdrop } from '../../interfaces/model-interfaces';
import AirdropsFetchRepository = require('../../repository/airdrops-fetch-repository');

class AirdropsUsersToReceivedService {
  public static async processAllAirdrops() {
    const manyAirdrops: IAirdrop[] = await AirdropsFetchRepository.getAllAirdrops();
    for (const airdrop of manyAirdrops) {
      await this.process(airdrop.id);
    }
  }

  public static async process(airdropId: number) {
    const lowerBoundExternalId: number | null =
      await AirdropsUsersRepository.findFirstIdWithStatus(airdropId, AirdropStatuses.WAITING);

    if (lowerBoundExternalId === null) {
      console.log('Nothing to process - no waiting users. Exiting...');

      return;
    }

    // #task - no criteria of airdrop. Should be composite one
    const manyRows: AirdropsReceiptTableRowsDto[] =
      await AirdropsFetchTableRowsService.getAirdropsReceiptTableRowsAfterExternalId(lowerBoundExternalId);

    if (manyRows.length === 0) {
      console.log('There are no any rows inside blockchain airdrops receipt table. Exiting...');

      return;
    }

    console.log(`Rows number to process is: ${manyRows.length}`);

    const numberOfTokens: number =
      await AirdropsTokensRepository.countNumberOfTokens(airdropId);

    let counter = 0;
    for (const row of manyRows) {
      const isProcessed = await this.processOneItem(airdropId, numberOfTokens, row);

      if (isProcessed) {
        counter += 1;
      }
    }

    console.log(`Processed counter value: ${counter}`);
  }

  private static async processOneItem(
    airdropId: number,
    numberOfTokens: number,
    row: AirdropsReceiptTableRowsDto,
  ): Promise<boolean> {
    const item: AirdropsUserToChangeStatusDto | null =
      await AirdropsUsersRepository.getOneDataForStatusToReceived(airdropId, row.external_id);

    if (item === null) {
      // console.log(`There is no item inside Db with external_id = ${row.external_id} and airdrop_id = ${airdropId}. Skipping...`);
      return false;
    }

    await knex.transaction(async (trx) => {
      await Promise.all([
        AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(
          item.account_id_from,
          item.account_id_to,
          item.amount,
          trx,
        ),
        AirdropsUsersRepository.setStatusReceived(item.id, trx),
      ]);

      const isReceived: boolean =
        await AirdropsUsersRepository.isAirdropReceivedByUser(
          airdropId,
          item.user_id,
          numberOfTokens,
          trx,
        );

      if (isReceived) {
        await AirdropsUsersExternalDataRepository.changeStatusToReceived(item.users_external_id, trx);
      }
    });

    return true;
  }
}

export = AirdropsUsersToReceivedService;
