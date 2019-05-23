"use strict";
const knex = require("../../../config/knex");
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
const UsersExternalModelProvider = require("../../users-external/service/users-external-model-provider");
const AirdropsModelProvider = require("../service/airdrops-model-provider");
const RepositoryHelper = require("../../common/repository/repository-helper");
const TABLE_NAME = AirdropsModelProvider.airdropsUsersExternalDataTableName();
const usersExternal = UsersExternalModelProvider.usersExternalTableName();
class AirdropsUsersExternalDataRepository {
    static async makeAreConditionsFulfilledTruthy(usersExternalId) {
        await knex(TABLE_NAME)
            .update({
            are_conditions_fulfilled: true,
        })
            .where('users_external_id', '=', usersExternalId);
    }
    static async updateOneByPrimaryKey(primaryKey, toUpdate) {
        await knex(TABLE_NAME)
            .update(toUpdate)
            .where('id', primaryKey);
    }
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
    static async getAllAirdropUsersByAirdropId(airdropId, blacklistedIds = []) {
        const data = await knex(TABLE_NAME)
            .select([
            `${usersExternal}.user_id AS user_id`,
        ])
            .where('airdrop_id', airdropId)
            .whereIn('status', [AirdropStatuses.RECEIVED, AirdropStatuses.NO_PARTICIPATION])
            .whereNotIn(`${TABLE_NAME}.id`, blacklistedIds)
            .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`);
        return data.map(item => +item.user_id);
    }
    static async findAllUsersExternalIdRelatedToAirdrop(airdropId) {
        const data = await knex(TABLE_NAME)
            .select(['users_external_id'])
            .where('airdrop_id', airdropId);
        return data.map(item => +item.users_external_id);
    }
    static async getManyUsersWithStatusNew(airdropId) {
        const blacklisted = AirdropsModelProvider.getUsersExternalDataBlacklistedIds();
        // #hardcore - it is a dirty solution of the participants issue. Pending worker here does too much work
        let whereRawSql = `
      ${TABLE_NAME}.airdrop_id = ${airdropId}
      AND ${usersExternal}.user_id IS NOT NULL
      AND (
        ${TABLE_NAME}.status = ${AirdropStatuses.NEW} 
        OR (
          ${TABLE_NAME}.status = ${AirdropStatuses.NO_PARTICIPATION} 
          AND ${TABLE_NAME}.are_conditions_fulfilled = false
        )
      )
    `;
        if (blacklisted.length > 0) {
            whereRawSql += ` AND ${TABLE_NAME}.id NOT IN (${blacklisted.join(', ')})`;
        }
        return knex(TABLE_NAME)
            .select([
            `${TABLE_NAME}.id AS primary_key`,
            `${TABLE_NAME}.json_data AS json_data`,
            `${TABLE_NAME}.users_external_id AS users_external_id`,
            `${TABLE_NAME}.status AS status`,
            `${usersExternal}.user_id AS user_id`,
        ])
            .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
            .whereRaw(whereRawSql);
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
    static async getOneByUsersExternalId(usersExternalId, airdropId) {
        const data = await knex(TABLE_NAME)
            .select([
            `${TABLE_NAME}.json_data`,
            `${TABLE_NAME}.status`,
        ])
            .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
            .where(`${TABLE_NAME}.users_external_id`, usersExternalId)
            .andWhere(`${TABLE_NAME}.airdrop_id`, airdropId)
            .first();
        return data || null;
    }
    static async getOneByUserIdAndAirdropId(userId, airdropId) {
        const data = await knex(TABLE_NAME)
            .select([
            `${TABLE_NAME}.id as primary_key`,
            `${TABLE_NAME}.users_external_id as users_external_id`,
            `${TABLE_NAME}.json_data`,
            `${TABLE_NAME}.status`,
            `${TABLE_NAME}.personal_statuses`,
        ])
            .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
            .where(`${usersExternal}.user_id`, userId)
            .where(`${TABLE_NAME}.airdrop_id`, airdropId)
            .first();
        RepositoryHelper.convertStringFieldsToNumbers(data, ['users_external_id', 'status'], ['users_external_id', 'status']);
        return data || null;
    }
    static async countAllParticipants(airdropId) {
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where('airdrop_id', airdropId)
            .andWhere('are_conditions_fulfilled', true)
            .whereNotIn(`${TABLE_NAME}.users_external_id`, [36, 38]);
        return RepositoryHelper.getKnexCountAsNumber(res);
    }
    static async getOneFullyByUserId(userId) {
        const data = await knex(TABLE_NAME)
            .innerJoin(`${usersExternal}`, `${TABLE_NAME}.users_external_id`, `${usersExternal}.id`)
            .where(`${usersExternal}.user_id`, userId)
            .first();
        return data || null;
    }
}
module.exports = AirdropsUsersExternalDataRepository;
