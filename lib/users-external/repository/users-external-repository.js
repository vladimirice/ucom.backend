"use strict";
const knex = require("../../../config/knex");
const UsersExternalModelProvider = require("../service/users-external-model-provider");
const TABLE_NAME = UsersExternalModelProvider.usersExternalTableName();
class UsersExternalRepository {
    static async upsertExternalUser(externalTypeId, externalId, externalLogin, jsonValue, user_id) {
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
    static async findExternalUserByExternalId(id) {
        const where = {
            external_id: id,
        };
        return knex(TABLE_NAME)
            .where(where)
            .first();
    }
}
module.exports = UsersExternalRepository;
