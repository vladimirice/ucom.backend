"use strict";
const winston_1 = require("../../../config/winston");
const knex = require("../../../config/knex");
const RepositoryHelper = require("../../common/repository/repository-helper");
const TABLE_NAME = 'organizations_current_params';
const foreignKeyField = 'organization_id';
class OrgsCurrentParamsRepository {
    static async getCurrentStatsByEntityId(entityId) {
        const data = await knex(TABLE_NAME).where(foreignKeyField, entityId).first();
        if (!data) {
            winston_1.ApiLogger.error(`There is no stats record for ${foreignKeyField} = ${entityId} but must be`);
            return null;
        }
        RepositoryHelper.convertStringFieldsToNumbers(data, this.getNumericalFields());
        return data;
    }
    static async insertRowForNewEntity(entityId) {
        const data = {
            [foreignKeyField]: entityId,
        };
        await knex(TABLE_NAME).insert(data);
    }
    static getNumericalFields() {
        return [
            'id',
            'organization_id',
            'importance_delta',
            'activity_index_delta',
            'posts_total_amount_delta',
        ];
    }
}
module.exports = OrgsCurrentParamsRepository;
