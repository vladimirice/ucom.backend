import { Transaction } from 'knex';
import { FreshUserDto } from '../interfaces/dto-interfaces';

import knex = require('../../../config/knex');
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import UsersExternalModelProvider = require('../../users-external/service/users-external-model-provider');
import AirdropsModelProvider = require('../service/airdrops-model-provider');

const TABLE_NAME = AirdropsModelProvider.airdropsUsersExternalDataTableName();
const usersExternal: string = UsersExternalModelProvider.usersExternalTableName();

class AirdropsUsersExternalDataRepository {
  public static async changeStatusToPending(usersExternalId: number, trx: Transaction): Promise<void> {
    await trx(TABLE_NAME)
      .update({
        status: AirdropStatuses.PENDING,
      })
      .where('users_external_id', '=', usersExternalId);
  }

  public static async changeStatusToNoParticipation(usersExternalId: number, trx: Transaction): Promise<void> {
    await trx(TABLE_NAME)
      .update({
        status: AirdropStatuses.NO_PARTICIPATION,
      })
      .where('users_external_id', '=', usersExternalId);
  }

  public static async changeStatusToReceived(usersExternalId: number, trx: Transaction): Promise<void> {
    await trx(TABLE_NAME)
      .update({
        status: AirdropStatuses.RECEIVED,
      })
      .where('users_external_id', '=', usersExternalId);
  }

  public static async getManyUsersWithStatusNew(
    airdropId: number,
  ): Promise<FreshUserDto[]> {
    return knex(TABLE_NAME)
      .select([
        `${TABLE_NAME}.json_data AS json_data`,
        `${TABLE_NAME}.users_external_id AS users_external_id`,
        `${usersExternal}.user_id AS user_id`,
      ])
      .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
      .where(`${TABLE_NAME}.airdrop_id`, '=', airdropId)
      .andWhere(`${TABLE_NAME}.status`, '=', AirdropStatuses.NEW)
      .andWhereRaw(`${usersExternal}.user_id IS NOT NULL`);
  }

  public static async insertOneData(
    airdropId: number,
    usersExternalId: number,
    score: number,
    jsonData: any,
    status: number,
  ): Promise<void> {
    await knex(TABLE_NAME)
      .insert({
        score,
        status,
        airdrop_id:         airdropId,
        users_external_id:  usersExternalId,
        json_data:          JSON.stringify(jsonData),
      });
  }

  public static async getOneByUsersExternalId(usersExternalId: number) {
    const data = await knex(TABLE_NAME)
      .select([
        `${TABLE_NAME}.json_data`,
        `${TABLE_NAME}.status`,
      ])
      .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
      .where(`${TABLE_NAME}.users_external_id`, usersExternalId)
      .first();

    return data || null;
  }

  public static async getOneByUserId(userId: number) {
    const data = await knex(TABLE_NAME)
      .select([
        `${TABLE_NAME}.json_data`,
        `${TABLE_NAME}.status`,
      ])
      .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
      .where(`${usersExternal}.user_id`, userId)
      .first();

    return data || null;
  }
}

export = AirdropsUsersExternalDataRepository;
