"use strict";
const knex = require("../../../config/knex");
const TABLE_NAME = 'airdrops_users_external_data';
class AirdropsUsersExternalDataRepository {
    static async insertOneData(usersExternalId, jsonData) {
        await knex(TABLE_NAME)
            .insert({
            users_external_id: usersExternalId,
            json_data: JSON.stringify(jsonData),
        });
    }
}
module.exports = AirdropsUsersExternalDataRepository;
