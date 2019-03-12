import knex = require('../../../config/knex');
import UsersExternalModelProvider = require('../service/users-external-model-provider');

const TABLE_NAME = UsersExternalModelProvider.usersExternalTableName();

class UsersExternalRepository {
  public static async upsertExternalUser(
    externalTypeId: number,
    externalId: number,
    externalLogin: string,
    jsonValue: any,
    user_id: number | null,
  ): Promise<number> {
    const sql = `
      INSERT INTO ${TABLE_NAME} (external_type_id, external_id, external_login, json_value, user_id) VALUES
      (${+externalTypeId}, ${+externalId}, '${externalLogin}', '${JSON.stringify(jsonValue)}', ${user_id})
      ON CONFLICT (external_type_id, external_id) DO
      UPDATE
          SET json_value        = EXCLUDED.json_value,
              updated_at        = EXCLUDED.updated_at,
              external_login    = EXCLUDED.external_login
              
      RETURNING id;
    ;
    `;

    const res = await knex.raw(sql);

    return +res.rows[0].id;
  }

  public static async findExternalUserByExternalId(id: number): Promise<any> {
    const where = {
      external_id: id,
    };

    return knex(TABLE_NAME)
      .where(where)
      .first()
    ;
  }
}

export = UsersExternalRepository;
