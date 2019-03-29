"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const knex = require("../../../../config/knex");
const UsersModelProvider = require("../../users-model-provider");
const lodash_1 = __importDefault(require("lodash"));
const RepositoryHelper = require("../../../common/repository/repository-helper");
const TABLE_NAME = UsersModelProvider.getUsersActivityTrustTableName();
class UsersActivityTrustRepository {
    static async insertOneTrustUser(userIdFrom, userIdTo, trx) {
        const entityName = UsersModelProvider.getEntityName();
        await trx(TABLE_NAME).insert({
            user_id: userIdFrom,
            entity_id: userIdTo,
            entity_name: entityName,
        });
    }
    static async deleteOneTrustUser(userIdFrom, userIdTo, trx) {
        const entityName = UsersModelProvider.getEntityName();
        const res = await trx(TABLE_NAME)
            .where({
            user_id: userIdFrom,
            entity_id: userIdTo,
            entity_name: entityName,
        })
            .delete('id');
        return lodash_1.default.isEmpty(res) ? null : +res[0].id;
    }
    static async doesUserTrustUser(userIdFrom, userIdTo) {
        const data = await this.getUserTrustUser(userIdFrom, userIdTo);
        return data !== null;
    }
    static async getUserTrustUser(userIdFrom, userIdTo) {
        const res = await knex(TABLE_NAME)
            .where({
            user_id: userIdFrom,
            entity_id: userIdTo,
            entity_name: UsersModelProvider.getEntityName(),
        })
            .first();
        return res || null;
    }
    static getUserIdsFromForUser(userIdTo, params) {
        return knex(TABLE_NAME)
            .select(['user_id'])
            .where({
            entity_id: userIdTo,
            entity_name: UsersModelProvider.getEntityName(),
        })
            .orderByRaw(params.orderByRaw)
            .limit(params.limit)
            .offset(params.offset);
    }
    static async countUsersThatTrustUser(userId) {
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where({
            entity_id: userId,
            entity_name: UsersModelProvider.getEntityName(),
        });
        return RepositoryHelper.getKnexCountAsNumber(res);
    }
}
module.exports = UsersActivityTrustRepository;
