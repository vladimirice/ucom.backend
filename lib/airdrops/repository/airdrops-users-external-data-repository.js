"use strict";
const knex = require("../../../config/knex");
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
const UsersExternalModelProvider = require("../../users-external/service/users-external-model-provider");
const AirdropsModelProvider = require("../service/airdrops-model-provider");
const TABLE_NAME = AirdropsModelProvider.airdropsUsersExternalDataTableName();
const usersExternal = UsersExternalModelProvider.usersExternalTableName();
class AirdropsUsersExternalDataRepository {
    static async changeStatusToPending(usersExternalId, trx) {
        await trx(TABLE_NAME)
            .update({
            status: AirdropStatuses.PENDING,
        })
            .where('users_external_id', '=', usersExternalId);
    }
    static async changeStatusToNoParticipation(usersExternalId, trx) {
        await trx(TABLE_NAME)
            .update({
            status: AirdropStatuses.NO_PARTICIPATION,
        })
            .where('users_external_id', '=', usersExternalId);
    }
    static async changeStatusToReceived(usersExternalId, trx) {
        await trx(TABLE_NAME)
            .update({
            status: AirdropStatuses.RECEIVED,
        })
            .where('users_external_id', '=', usersExternalId);
    }
    static async getManyUsersWithStatusNew(airdropId) {
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
    static async insertOneData(airdropId, usersExternalId, score, jsonData, status) {
        await knex(TABLE_NAME)
            .insert({
            score,
            status,
            airdrop_id: airdropId,
            users_external_id: usersExternalId,
            json_data: JSON.stringify(jsonData),
        });
    }
    static async getOneByUsersExternalId(usersExternalId) {
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
    static async getOneByUserId(userId) {
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
module.exports = AirdropsUsersExternalDataRepository;
