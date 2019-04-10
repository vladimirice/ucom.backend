"use strict";
const AirdropsModelProvider = require("../service/airdrops-model-provider");
const knex = require("../../../config/knex");
const RepositoryHelper = require("../../common/repository/repository-helper");
const AccountsModelProvider = require("../../accounts/service/accounts-model-provider");
const UsersModelProvider = require("../../users/users-model-provider");
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
const TABLE_NAME = AirdropsModelProvider.airdropsUsersTableName();
const accounts = AccountsModelProvider.accountsTableName();
const accountsSymbols = AccountsModelProvider.accountsSymbolsTableName();
const users = UsersModelProvider.getUsersTableName();
class AirdropsUsersRepository {
    static async countAllAirdropParticipants(airdropId) {
        const res = await knex(TABLE_NAME)
            .countDistinct(`${TABLE_NAME}.user_id AS amount`)
            .where('airdrop_id', '=', airdropId);
        return RepositoryHelper.getKnexCountAsNumber(res);
    }
    static async getDataForStatusToWaiting(limit) {
        const rows = await knex(TABLE_NAME)
            .select([
            `${users}.account_name AS account_name_to`,
            `${TABLE_NAME}.user_id`,
            `${TABLE_NAME}.id AS id`,
            `${TABLE_NAME}.airdrop_id`,
            `${TABLE_NAME}.reserved_account_id AS account_id_from`,
            `${accounts}.current_balance AS amount`,
            `${TABLE_NAME}.waiting_account_id AS account_id_to`,
            `${accounts}.symbol_id AS symbol_id`,
            `${accountsSymbols}.title AS symbol_title`,
        ])
            .innerJoin(accounts, `${TABLE_NAME}.reserved_account_id`, `${accounts}.id`)
            .innerJoin(accountsSymbols, `${accounts}.symbol_id`, `${accountsSymbols}.id`)
            .innerJoin(users, `${TABLE_NAME}.user_id`, `${users}.id`)
            .where(`${TABLE_NAME}.status`, '=', AirdropStatuses.PENDING)
            .orderBy(`${TABLE_NAME}.id`, 'DESC')
            .limit(limit);
        const toNumeric = [
            'account_id_from',
            'amount',
            'account_id_to',
            'airdrop_id',
            'id',
        ];
        const disallowZero = [
            'account_id_from',
            'amount',
            'account_id_to',
            'airdrop_id',
            'id',
        ];
        RepositoryHelper.convertStringFieldsToNumbersForArray(rows, toNumeric, disallowZero);
        return rows;
    }
    static async getAllAirdropsUsersDataByUserId(userId, airdropId) {
        const sql = `
      SELECT
         airdrops_users.status AS status,
         reserved.symbol_id AS reserved_symbol_id,
        
         reserved.account_type AS reserved__account_type,
         reserved.user_id AS reserved__user_id,
         reserved.symbol_id AS reserved__symbol_id,
         reserved.current_balance AS reserved__current_balance,
         reserved.last_transaction_id AS reserved__last_transaction_id,

         waiting.account_type AS waiting__account_type,
         waiting.user_id AS waiting__user_id,
         waiting.symbol_id AS waiting__symbol_id,
         waiting.current_balance AS waiting__current_balance,
         waiting.last_transaction_id AS waiting__last_transaction_id,

         wallet.account_type AS wallet__account_type,
         wallet.user_id AS wallet__user_id,
         wallet.symbol_id AS wallet__symbol_id,
         wallet.current_balance AS wallet__current_balance,
         wallet.last_transaction_id AS wallet__last_transaction_id
      FROM 
           airdrops_users
      INNER JOIN accounts reserved  ON airdrops_users.reserved_account_id = reserved.id
      INNER JOIN accounts waiting   ON airdrops_users.waiting_account_id = waiting.id
      INNER JOIN accounts wallet    ON airdrops_users.wallet_account_id = wallet.id
      WHERE airdrops_users.airdrop_id = ${+airdropId}
      AND airdrops_users.user_id = ${+userId}
    `;
        const res = await knex.raw(sql);
        const data = res.rows;
        RepositoryHelper.hydrateObjectForManyEntities(data, 'reserved__');
        RepositoryHelper.hydrateObjectForManyEntities(data, 'waiting__');
        RepositoryHelper.hydrateObjectForManyEntities(data, 'wallet__');
        return data;
    }
    static async setStatusWaiting(id, trx) {
        await trx(TABLE_NAME)
            .where('id', '=', id)
            .update({ status: AirdropStatuses.WAITING });
    }
    static async insertNewRecord(userId, airdropId, reservedAccountId, waitingAccountId, walletAccountId, trx) {
        await trx(TABLE_NAME).insert({
            user_id: userId,
            airdrop_id: airdropId,
            reserved_account_id: reservedAccountId,
            waiting_account_id: waitingAccountId,
            wallet_account_id: walletAccountId,
            status: AirdropStatuses.PENDING,
        });
    }
    static getAllOfAirdropForOneUser(airdropId, userId) {
        return knex(TABLE_NAME)
            .where({
            airdrop_id: airdropId,
            user_id: userId,
        });
    }
}
module.exports = AirdropsUsersRepository;
