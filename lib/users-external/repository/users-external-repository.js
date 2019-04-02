"use strict";
const knex = require("../../../config/knex");
const UsersExternalModelProvider = require("../service/users-external-model-provider");
const RepositoryHelper = require("../../common/repository/repository-helper");
const ExternalTypeIdDictionary = require("../dictionary/external-type-id-dictionary");
const AirdropsModelProvider = require("../../airdrops/service/airdrops-model-provider");
const TABLE_NAME = UsersExternalModelProvider.usersExternalTableName();
const airdropsUsersExternalData = AirdropsModelProvider.airdropsUsersExternalDataTableName();
class UsersExternalRepository {
    static async getUserExternalWithExternalAirdropData(userId) {
        return knex(TABLE_NAME)
            .select([
            `${TABLE_NAME}.id AS primary_key`,
            `${TABLE_NAME}.external_id AS external_id`,
            `${airdropsUsersExternalData}.status AS status`,
            `${airdropsUsersExternalData}.json_data AS json_data`,
        ])
            .leftJoin(airdropsUsersExternalData, `${TABLE_NAME}.id`, `${airdropsUsersExternalData}.users_external_id`)
            .where(`${TABLE_NAME}.user_id`, '=', userId)
            .first();
    }
    static async setUserId(id, userId) {
        await knex(TABLE_NAME)
            .where('id', '=', id)
            .update({ user_id: userId });
    }
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
    static async findGithubUserExternalExternalId(id) {
        const where = {
            external_id: id,
            external_type_id: ExternalTypeIdDictionary.github(),
        };
        const res = await knex(TABLE_NAME)
            .where(where)
            .first();
        if (!res) {
            return null;
        }
        RepositoryHelper.convertStringFieldsToNumbers(res, this.getNumericalFields());
        return res;
    }
    static async findGithubUserExternalByPkId(id) {
        const where = {
            id,
            external_type_id: ExternalTypeIdDictionary.github(),
        };
        const res = await knex(TABLE_NAME)
            .where(where)
            .first();
        if (!res) {
            return null;
        }
        RepositoryHelper.convertStringFieldsToNumbers(res, this.getNumericalFields());
        return res;
    }
    static async findGithubUserExternalByUserId(userId) {
        const where = {
            user_id: userId,
            external_type_id: ExternalTypeIdDictionary.github(),
        };
        const res = await knex(TABLE_NAME)
            .where(where)
            .first();
        if (!res) {
            return null;
        }
        RepositoryHelper.convertStringFieldsToNumbers(res, this.getNumericalFields());
        return res;
    }
    static getNumericalFields() {
        return [
            'id',
        ];
    }
}
module.exports = UsersExternalRepository;
