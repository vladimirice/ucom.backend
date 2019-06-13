"use strict";
const RepositoryHelper = require("../../repository/repository-helper");
class KnexQueryBuilderHelper {
    static async countByQueryBuilder(query, repository, knex) {
        this.addCountParamsToKnex(query, repository, knex);
        const data = await knex;
        return RepositoryHelper.getKnexCountAsNumber(data);
    }
    static async addCountToQueryBuilderAndCalculate(queryBuilder, countPrefix) {
        queryBuilder.count(`${countPrefix}.id as amount`);
        const data = await queryBuilder;
        return RepositoryHelper.getKnexCountAsNumber(data);
    }
    static async getListByQueryBuilder(repository, knex) {
        const data = await knex;
        RepositoryHelper.convertStringFieldsToNumbersForArray(data, repository.getNumericalFields(), repository.getFieldsToDisallowZero());
        return data;
    }
    static addCountParamsToKnex(query, repository, knex) {
        repository.addWhere(query, knex);
        knex.count('id as amount');
    }
}
module.exports = KnexQueryBuilderHelper;
