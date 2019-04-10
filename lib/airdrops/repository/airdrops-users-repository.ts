import { QueryBuilder, Transaction } from 'knex';
import { AirdropsUserToChangeStatusDto } from '../interfaces/dto-interfaces';

import AirdropsModelProvider = require('../service/airdrops-model-provider');
import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');
import AccountsModelProvider = require('../../accounts/service/accounts-model-provider');
import UsersModelProvider = require('../../users/users-model-provider');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

const TABLE_NAME = AirdropsModelProvider.airdropsUsersTableName();
const accounts = AccountsModelProvider.accountsTableName();
const accountsSymbols = AccountsModelProvider.accountsSymbolsTableName();
const users = UsersModelProvider.getUsersTableName();

class AirdropsUsersRepository {
  public static async findFirstIdWithStatus(
    airdropId: number,
    status: number,
  ): Promise<number> {
    const res = await knex(TABLE_NAME)
      .select(['id'])
      .where({
        status,
        airdrop_id: airdropId,
      })
      .orderBy('id', 'ASC')
      .limit(1);

    return RepositoryHelper.getKnexOneIdReturningOrException(res);
  }

  public static async countAllAirdropParticipants(
    airdropId: number,
  ): Promise<number> {
    const res = await knex(TABLE_NAME)
      .countDistinct(`${TABLE_NAME}.user_id AS amount`)
      .where('airdrop_id', '=', airdropId);

    return RepositoryHelper.getKnexCountAsNumber(res);
  }

  public static async getOneDataForStatusToReceived(id: number): Promise<AirdropsUserToChangeStatusDto | null> {
    const qb = knex(TABLE_NAME)
      .where(`${TABLE_NAME}.id`, '=', id);

    const res = await this.getChangeStatusDto(
      qb,
      'waiting_account_id',
      'wallet_account_id',
    );

    return res.length === 1 ? res[0] : null;
  }

  public static async getDataForStatusToWaiting(
    limit: number,
  ): Promise<AirdropsUserToChangeStatusDto[]> {
    const qb = knex(TABLE_NAME)
      .where(`${TABLE_NAME}.status`, '=', AirdropStatuses.PENDING)
      .orderBy(`${TABLE_NAME}.id`, 'DESC')
      .limit(limit);

    return this.getChangeStatusDto(
      qb,
      'reserved_account_id',
      'waiting_account_id',
    );
  }

  private static async getChangeStatusDto(
    qb: QueryBuilder,
    accountFrom: string,
    accountTo: string,
  ): Promise<AirdropsUserToChangeStatusDto[]> {
    const rows: any[] = await qb
      .select([
        `${users}.account_name AS account_name_to`,
        `${TABLE_NAME}.user_id`,

        `${TABLE_NAME}.id AS id`,
        `${TABLE_NAME}.airdrop_id`,

        `${TABLE_NAME}.${accountFrom} AS account_id_from`,
        `${accounts}.current_balance AS amount`,

        `${TABLE_NAME}.${accountTo} AS account_id_to`,

        `${accounts}.symbol_id AS symbol_id`,
        `${accountsSymbols}.title AS symbol_title`,
      ])
      .innerJoin(accounts, `${TABLE_NAME}.${accountFrom}`, `${accounts}.id`)
      .innerJoin(accountsSymbols, `${accounts}.symbol_id`, `${accountsSymbols}.id`)
      .innerJoin(users, `${TABLE_NAME}.user_id`, `${users}.id`);

    const toNumeric = [
      'account_id_from',
      'amount',
      'account_id_to',
      'airdrop_id',
      'id',
    ];

    const disallowZero = [
      'account_id_from',
      'amount',
      'account_id_to',
      'airdrop_id',
      'id',
    ];

    RepositoryHelper.convertStringFieldsToNumbersForArray(rows, toNumeric, disallowZero);

    return rows;
  }

  public static async getAllAirdropsUsersDataByUserId(
    userId: number,
    airdropId: number,
  ) {
    const sql = `
      SELECT
         airdrops_users.status AS status,
         airdrops_users.id AS id,
         u.account_name AS account_name,
         reserved.symbol_id AS reserved_symbol_id,
         s.title AS symbol_title,
        
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
      INNER JOIN "Users" u          ON u.id = airdrops_users.user_id
      INNER JOIN accounts_symbols s ON reserved.symbol_id = s.id
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

  public static async setStatusWaiting(id: number, trx: Transaction): Promise<void> {
    await trx(TABLE_NAME)
      .where('id', '=', id)
      .update({ status: AirdropStatuses.WAITING });
  }

  public static async setStatusReceived(id: number, trx: Transaction): Promise<void> {
    await trx(TABLE_NAME)
      .where('id', '=', id)
      .update({ status: AirdropStatuses.RECEIVED });
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
