import { Transaction } from 'knex';

import AirdropsModelProvider = require('../service/airdrops-model-provider');
import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

const TABLE_NAME = AirdropsModelProvider.airdropsUsersTableName();

class AirdropsUsersRepository {
  public static async countAllAirdropParticipants(
    airdropId: number,
  ): Promise<number> {
    const res = await knex(TABLE_NAME)
      .countDistinct(`${TABLE_NAME}.user_id AS amount`)
      .where('airdrop_id', '=', airdropId);

    return RepositoryHelper.getKnexCountAsNumber(res);
  }

  public static async getAllAirdropsUsersDataByUserId(userId: number, airdropId: number) {
    const sql = `
      SELECT
         airdrops_users.status AS status,
         reserved.symbol_id AS reserved_symbol_id,
        
         reserved.account_type AS reserved__account_type,
         reserved.user_id AS reserved__user_id,
         reserved.symbol_id AS reserved__symbol_id,
         reserved.current_balance AS reserved__current_balance,
         reserved.last_transaction_id AS reserved__last_transaction_id,

         waiting.account_type AS waiting__account_type,
         waiting.user_id AS waiting__user_id,
         waiting.symbol_id AS waiting__symbol_id,
         waiting.current_balance AS waiting__current_balance,
         waiting.last_transaction_id AS waiting__last_transaction_id,

         wallet.account_type AS wallet__account_type,
         wallet.user_id AS wallet__user_id,
         wallet.symbol_id AS wallet__symbol_id,
         wallet.current_balance AS wallet__current_balance,
         wallet.last_transaction_id AS wallet__last_transaction_id
      FROM 
           airdrops_users
      INNER JOIN accounts reserved  ON airdrops_users.reserved_account_id = reserved.id
      INNER JOIN accounts waiting   ON airdrops_users.waiting_account_id = waiting.id
      INNER JOIN accounts wallet    ON airdrops_users.wallet_account_id = wallet.id
      WHERE airdrops_users.airdrop_id = ${+airdropId}
      AND airdrops_users.user_id = ${+userId}
    `;

    const res = await knex.raw(sql);
    const data = res.rows;

    RepositoryHelper.hydrateObjectForManyEntities(data, 'reserved__');
    RepositoryHelper.hydrateObjectForManyEntities(data, 'waiting__');
    RepositoryHelper.hydrateObjectForManyEntities(data, 'wallet__');

    return data;
  }

  public static async insertNewRecord(
    userId: number,
    airdropId: number,
    reservedAccountId: number,
    waitingAccountId: number,
    walletAccountId: number,
    trx: Transaction,
  ): Promise<void> {
    await trx(TABLE_NAME).insert({
      user_id: userId,
      airdrop_id: airdropId,
      reserved_account_id: reservedAccountId,
      waiting_account_id: waitingAccountId,
      wallet_account_id: walletAccountId,
      status: AirdropStatuses.PENDING,
    });
  }

  public static getAllOfAirdropForOneUser(
    airdropId: number,
    userId: number,
  ) {
    return knex(TABLE_NAME)
      .where({
        airdrop_id: airdropId,
        user_id:    userId,
      });
  }
}

export = AirdropsUsersRepository;
