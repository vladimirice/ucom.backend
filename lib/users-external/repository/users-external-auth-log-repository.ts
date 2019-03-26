import knex = require('../../../config/knex');
import UsersExternalModelProvider = require('../service/users-external-model-provider');

const TABLE_NAME = UsersExternalModelProvider.usersExternalAuthLogTableName();

class UsersExternalAuthLogRepository {
  public static async insertOneAuthLog(data): Promise<void> {
    await knex(TABLE_NAME).insert(data);
  }

  public static async findManyByUsersExternalId(id: number): Promise<any> {
    const where = {
      users_external_id: id,
    };

    return knex(TABLE_NAME)
      .where(where)
    ;
  }
}

export = UsersExternalAuthLogRepository;
