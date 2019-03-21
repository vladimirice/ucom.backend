import knex = require('../../../config/knex');

const TABLE_NAME = 'airdrops_users_external_data';

class AirdropsUsersExternalDataRepository {
  public static async insertOneData(
    usersExternalId: number,
    jsonData: any,
  ): Promise<void> {
    await knex(TABLE_NAME)
      .insert({
        users_external_id: usersExternalId,
        json_data: JSON.stringify(jsonData),
      });
  }
}

export = AirdropsUsersExternalDataRepository;
