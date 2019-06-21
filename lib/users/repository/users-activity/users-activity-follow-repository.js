"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const lodash_1 = __importDefault(require("lodash"));
const knex = require("../../../../config/knex");
const UsersModelProvider = require("../../users-model-provider");
const OrganizationsModelProvider = require("../../../organizations/service/organizations-model-provider");
const RepositoryHelper = require("../../../common/repository/repository-helper");
const TABLE_NAME = UsersModelProvider.getUsersActivityFollowTableName();
const orgsEntityName = OrganizationsModelProvider.getEntityName();
const usersEntityName = UsersModelProvider.getEntityName();
class UsersActivityFollowRepository {
    static async insertOneFollowsOrganization(userIdFrom, orgIdTo, trx) {
        await trx(TABLE_NAME).insert({
            user_id: userIdFrom,
            entity_id: orgIdTo,
            entity_name: orgsEntityName,
        });
    }
    static async deleteOneFollowsOrg(userIdFrom, orgIdTo, trx) {
        const res = await trx(TABLE_NAME)
            .where({
            user_id: userIdFrom,
            entity_id: orgIdTo,
            entity_name: orgsEntityName,
        })
            .delete('id');
        return lodash_1.default.isEmpty(res) ? null : +res[0].id;
    }
    static async doesUserFollowOrg(userIdFrom, orgIdTo) {
        const data = await this.getUserFollowsOrg(userIdFrom, orgIdTo);
        return data !== null;
    }
    static async getUserFollowsOrg(userIdFrom, orgIdTo) {
        const res = await knex(TABLE_NAME)
            .where({
            user_id: userIdFrom,
            entity_id: orgIdTo,
            entity_name: orgsEntityName,
        })
            .first();
        return res || null;
    }
    static async insertOneFollowsOtherUser(userIdFrom, userIdTo, trx) {
        await trx(TABLE_NAME).insert({
            user_id: userIdFrom,
            entity_id: userIdTo,
            entity_name: usersEntityName,
        });
    }
    static async deleteOneFollowsOtherUser(userIdFrom, userIdTo, trx) {
        const res = await trx(TABLE_NAME)
            .where({
            user_id: userIdFrom,
            entity_id: userIdTo,
            entity_name: usersEntityName,
        })
            .delete('id');
        return lodash_1.default.isEmpty(res) ? null : +res[0].id;
    }
    static async doesUserFollowOtherUser(userIdFrom, userIdTo) {
        const data = await this.getUserFollowsOtherUser(userIdFrom, userIdTo);
        return data !== null;
    }
    static async getUserFollowsOtherUser(userIdFrom, userIdTo) {
        const res = await knex(TABLE_NAME)
            .where({
            user_id: userIdFrom,
            entity_id: userIdTo,
            entity_name: usersEntityName,
        })
            .first();
        return res || null;
    }
    static addWhereInOrgsEntityId(queryBuilder, tableName, userId) {
        queryBuilder
            // eslint-disable-next-line func-names
            .whereIn(`${tableName}.id`, function () {
            // @ts-ignore
            this
                .select('entity_id')
                .from(TABLE_NAME)
                .where({
                user_id: userId,
                entity_name: orgsEntityName,
            });
        });
    }
    static async countUsersThatFollowUser(userId) {
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where({
            entity_id: userId,
            entity_name: UsersModelProvider.getEntityName(),
        });
        return RepositoryHelper.getKnexCountAsNumber(res);
    }
    static async countUsersIFollow(userId) {
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where({
            user_id: userId,
            entity_name: UsersModelProvider.getEntityName(),
        });
        return RepositoryHelper.getKnexCountAsNumber(res);
    }
}
module.exports = UsersActivityFollowRepository;
