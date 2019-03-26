"use strict";
const knex = require("../../../config/knex");
const UsersExternalModelProvider = require("../service/users-external-model-provider");
const TABLE_NAME = UsersExternalModelProvider.usersExternalAuthLogTableName();
class UsersExternalAuthLogRepository {
    static async insertOneAuthLog(data) {
        await knex(TABLE_NAME).insert(data);
    }
    static async findManyByUsersExternalId(id) {
        const where = {
            users_external_id: id,
        };
        return knex(TABLE_NAME)
            .where(where);
    }
}
module.exports = UsersExternalAuthLogRepository;
