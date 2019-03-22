"use strict";
const knex = require("../../../config/knex");
const UsersExternalModelProvider = require("../../users-external/service/users-external-model-provider");
const AirdropsModelProvider = require("../service/airdrops-model-provider");
const TABLE_NAME = AirdropsModelProvider.airdropsUsersExternalDataTableName();
const usersExternal = UsersExternalModelProvider.usersExternalTableName();
class AirdropsUsersExternalDataRepository {
    static async insertOneData(usersExternalId, jsonData) {
        await knex(TABLE_NAME)
            .insert({
            users_external_id: usersExternalId,
            json_data: JSON.stringify(jsonData),
        });
    }
    static async getJsonDataByUsersExternalId(usersExternalId) {
        const data = await knex(TABLE_NAME)
            .select('json_data')
            .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
            .where(`${TABLE_NAME}.users_external_id`, usersExternalId)
            .first();
        return data ? data.json_data : null;
    }
}
module.exports = AirdropsUsersExternalDataRepository;
