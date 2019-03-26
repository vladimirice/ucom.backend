"use strict";
const AirdropsModelProvider = require("../service/airdrops-model-provider");
const knex = require("../../../config/knex");
const AccountsModelProvider = require("../../accounts/service/accounts-model-provider");
const RepositoryHelper = require("../../common/repository/repository-helper");
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
const TABLE_NAME = AirdropsModelProvider.airdropsTokensTableName();
class AirdropsTokensRepository {
    static async insertNewRecord(airdropId, incomeAccountId, debtAccountId, trx) {
        await trx(TABLE_NAME).insert({
            airdrop_id: airdropId,
            income_account_id: incomeAccountId,
            debt_account_id: debtAccountId,
            status: AirdropStatuses.NEW,
        });
    }
    static async getAirdropsAccountDataById(airdropId) {
        const accounts = AccountsModelProvider.accountsTableName();
        const symbols = AccountsModelProvider.accountsSymbolsTableName();
        const data = await knex(TABLE_NAME)
            .select([
            `${accounts}.id AS debt_account_id`,
            `${accounts}.symbol_id AS symbol_id`,
            `${symbols}.title AS symbol`,
            `${accounts}.current_balance AS current_balance`,
        ])
            .innerJoin(`${accounts}`, `${accounts}.id`, `${TABLE_NAME}.debt_account_id`)
            .innerJoin(`${symbols}`, `${symbols}.id`, `${accounts}.symbol_id`)
            .where(`${TABLE_NAME}.airdrop_id`, airdropId);
        const numericalFields = [
            'debt_account_id',
            'current_balance',
        ];
        const fieldsToDisallowZero = [
            'debt_account_id',
            'current_balance',
        ];
        data.forEach((row) => {
            RepositoryHelper.convertStringFieldsToNumbers(row, numericalFields, fieldsToDisallowZero);
        });
        return data;
    }
}
module.exports = AirdropsTokensRepository;
