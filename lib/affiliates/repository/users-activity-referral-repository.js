"use strict";
const UsersModelProvider = require("../../users/users-model-provider");
const knex = require("../../../config/knex");
const RepositoryHelper = require("../../common/repository/repository-helper");
const TABLE_NAME = UsersModelProvider.getUsersActivityReferralTableName();
class UsersActivityReferralRepository {
    static async insertOneUserReferral(conversionDto, transaction) {
        const entityName = UsersModelProvider.getEntityName();
        await transaction(TABLE_NAME).insert({
            referral_user_id: conversionDto.referral_user_id,
            source_entity_id: conversionDto.source_user_id,
            conversion_id: conversionDto.conversion_id,
            entity_name: entityName,
        });
    }
    static async doesUserReferralExist(referralUserId, sourceUserId) {
        const queryBuilder = knex(TABLE_NAME)
            .where({
            referral_user_id: referralUserId,
            source_entity_id: sourceUserId,
            entity_name: UsersModelProvider.getEntityName(),
        });
        return RepositoryHelper.doesExistByQueryBuilder(queryBuilder);
    }
    static async countReferralsOfUser(userId) {
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where({
            source_entity_id: userId,
            entity_name: UsersModelProvider.getEntityName(),
        });
        return RepositoryHelper.getKnexCountAsNumber(res);
    }
}
module.exports = UsersActivityReferralRepository;
