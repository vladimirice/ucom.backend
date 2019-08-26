"use strict";
const winston_1 = require("../../../config/winston");
const UsersModelProvider = require("../users-model-provider");
const knex = require("../../../config/knex");
const RepositoryHelper = require("../../common/repository/repository-helper");
const TABLE_NAME = UsersModelProvider.getCurrentParamsTableName();
const foreignKeyField = UsersModelProvider.getForeignKeyField();
class UsersCurrentParamsRepository {
    static async getCurrentStatsByEntityId(entityId) {
        const data = await knex(TABLE_NAME).where(foreignKeyField, entityId).first();
        if (!data) {
            winston_1.ApiLogger.error(`There is no stats record for ${foreignKeyField} = ${entityId} but must be`);
            return null;
        }
        RepositoryHelper.convertStringFieldsToNumbers(data, this.getNumericalFields());
        return data;
    }
    static async insertRowForNewEntity(entityId, transaction) {
        const data = {
            [foreignKeyField]: entityId,
        };
        const queryBuilderObject = transaction || knex;
        await queryBuilderObject(TABLE_NAME).insert(data);
    }
    static getNumericalFields() {
        return [
            'id',
            foreignKeyField,
            'scaled_importance_delta',
            'scaled_social_rate_delta',
            'posts_total_amount_delta',
        ];
    }
}
module.exports = UsersCurrentParamsRepository;
