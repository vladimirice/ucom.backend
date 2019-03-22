import knex = require('../../../config/knex');
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import UsersExternalModelProvider = require('../../users-external/service/users-external-model-provider');
import AirdropsModelProvider = require('../service/airdrops-model-provider');

const TABLE_NAME = AirdropsModelProvider.airdropsUsersExternalDataTableName();
const usersExternal: string = UsersExternalModelProvider.usersExternalTableName();

class AirdropsUsersExternalDataRepository {
  public static async getManyUsersWithStatusNew(
    airdropId: number,
  ) {
    return knex(TABLE_NAME)
      .select([
        `${TABLE_NAME}.json_data AS json_data`,
        `${usersExternal}.user_id AS user_id`,
      ])
      .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
      .where({
        [`${TABLE_NAME}.airdrop_id`]: airdropId,
        [`${TABLE_NAME}.status`]: AirdropStatuses.New,
      });
  }

  public static async insertOneData(
    airdropId: number,
    usersExternalId: number,
    jsonData: any,
  ): Promise<void> {
    await knex(TABLE_NAME)
      .insert({
        airdrop_id:         airdropId,
        users_external_id:  usersExternalId,
        json_data:          JSON.stringify(jsonData),
      });
  }

  public static async getJsonDataByUsersExternalId(usersExternalId: number) {
    const data = await knex(TABLE_NAME)
      .select('json_data')
      .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
      .where(`${TABLE_NAME}.users_external_id`, usersExternalId)
      .first();

    return data ? data.json_data : null;
  }
}

export = AirdropsUsersExternalDataRepository;
