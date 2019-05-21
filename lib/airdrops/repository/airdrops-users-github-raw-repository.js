"use strict";
const knex = require("../../../config/knex");
const RepositoryHelper = require("../../common/repository/repository-helper");
const AirdropsModelProvider = require("../service/airdrops-model-provider");
const TABLE_NAME = AirdropsModelProvider.airdropsUsersGithubRawTableName();
class AirdropsUsersGithubRawRepository {
    static async getScoreAndAmountByGithubId(githubId) {
        const data = await knex(TABLE_NAME)
            .select(['id', 'score', 'amount'])
            .where('id', '=', githubId);
        RepositoryHelper.convertStringFieldsToNumbersForArray(data, this.getNumericalFields(), this.getFieldsToDisallowZero());
        return data.length > 0 ? data[0] : null;
    }
    static getNumericalFields() {
        return [
            'id',
            'score',
            'amount',
        ];
    }
    static getFieldsToDisallowZero() {
        return [
            'id',
        ];
    }
}
module.exports = AirdropsUsersGithubRawRepository;
