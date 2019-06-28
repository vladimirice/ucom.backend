"use strict";
const errors_1 = require("../../api/errors");
const knex = require("../../../config/knex");
const RepositoryHelper = require("../../common/repository/repository-helper");
const AirdropsModelProvider = require("../service/airdrops-model-provider");
const ROUND_ONE_TABLE_NAME = AirdropsModelProvider.airdropsUsersGithubRawTableName();
const ROUND_TWO_TABLE_NAME = AirdropsModelProvider.airdropsUsersGithubRawRoundTwoTableName();
const SOURCE_TABLE_NAMES = [
    ROUND_ONE_TABLE_NAME,
    ROUND_TWO_TABLE_NAME,
];
class AirdropsUsersGithubRawRepository {
    static async getScoreAndAmountByGithubId(githubId, sourceTableName) {
        if (!SOURCE_TABLE_NAMES.includes(sourceTableName)) {
            throw new errors_1.AppError(`Unsupported source table name: ${sourceTableName}`);
        }
        const data = await knex(sourceTableName)
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
