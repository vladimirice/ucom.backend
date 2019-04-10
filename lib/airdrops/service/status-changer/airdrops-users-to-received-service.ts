import { AirdropsReceiptTableRowsDto, AirdropsUserToChangeStatusDto } from '../../interfaces/dto-interfaces';

import AirdropsFetchTableRowsService = require('../blockchain/airdrops-fetch-table-rows-service');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import AirdropsUsersRepository = require('../../repository/airdrops-users-repository');
import knex = require('../../../../config/knex');
import AccountsTransactionsCreatorService = require('../../../accounts/service/accounts-transactions-creator-service');

class AirdropsUsersToReceivedService {
  public static async process(airdropId: number) {
    const lowerBoundExternalId: number =
      await AirdropsUsersRepository.findFirstIdWithStatus(airdropId, AirdropStatuses.WAITING);

    const manyRows: AirdropsReceiptTableRowsDto[] =
      await AirdropsFetchTableRowsService.getAirdropsReceiptTableRowsAfterExternalId(lowerBoundExternalId);

    for (const row of manyRows) {
      await this.processOneItem(row);
    }
  }

  private static async processOneItem(row: AirdropsReceiptTableRowsDto) {
    const item: AirdropsUserToChangeStatusDto | null =
      await AirdropsUsersRepository.getOneDataForStatusToReceived(row.external_id);

    if (item === null) {
      return;
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




    });

    /*

      check if all airdrops_user records of current user have confirmed status - 0.5


  SELECT COUNT(1), status
  FROM
  airdrops_users WHERE
  airdrop_id = 1
  AND user_id = ${given_user}
    GROUP BY status;


  if (res.length === 1 && res[0].status === ${RECEIVED}) {
    change airdrops_users_external_data status to confirmed
  }


  commit transaction
 */
  }
}

export = AirdropsUsersToReceivedService;
