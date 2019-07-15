"use strict";
/* eslint-disable func-names */
const BlockchainModelProvider = require("../../eos/service/blockchain-model-provider");
const knex = require("../../../config/knex");
const UsersModelProvider = require("../../users/users-model-provider");
const EnvHelper = require("../../common/helper/env-helper");
const TABLE_NAME = BlockchainModelProvider.irreversibleTracesTableName();
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
class IrreversibleTracesRepository {
    static async insertManyTraces(traces) {
        const sql = knex(TABLE_NAME).insert(traces).toSQL();
        // eslint-disable-next-line no-return-assign
        const data = await knex.raw(sql.sql += ' ON CONFLICT DO NOTHING RETURNING tr_id;', sql.bindings);
        return data.rows.map(item => item.tr_id);
    }
    static async findLastBlockNumber() {
        const res = await knex.select('block_number')
            .from(TABLE_NAME)
            .orderBy('block_number', 'DESC')
            .limit(1)
            .first();
        return res ? +res.block_number : null;
    }
    static async findAllByAccountNameFromTo(accountName, params) {
        const relUserAlias = 'rel_user';
        const delimiter = '__';
        const toSelect = [];
        const usersPreviewFields = UsersModelProvider.getUserFieldsForPreview();
        usersPreviewFields.forEach((field) => {
            toSelect.push(`${relUserAlias}.${field} AS ${relUserAlias}${delimiter}${field}`);
        });
        const mainTableFields = [
            'tr_executed_at',
            'tr_type',
            'tr_processed_data',
            'memo',
            'account_name_from',
            'account_name_to',
            'raw_tr_data',
        ];
        mainTableFields.forEach((field) => {
            toSelect.push(`${TABLE_NAME}.${field} AS ${field}`);
        });
        const queryBuilder = knex.select(toSelect)
            .from(TABLE_NAME)
            .andWhere(function () {
            this.where('account_name_from', accountName);
            this.orWhere('account_name_to', accountName);
        })
            .leftJoin(`Users AS ${relUserAlias}`, function () {
            this.on(function () {
                this.on(function () {
                    this.on(`${TABLE_NAME}.account_name_from`, '=', `${relUserAlias}.account_name`);
                    this.andOn(`${TABLE_NAME}.account_name_from`, '!=', knex.raw('?', accountName));
                });
                this.orOn(function () {
                    this.on(`${TABLE_NAME}.account_name_to`, '=', `${relUserAlias}.account_name`);
                    this.andOn(`${TABLE_NAME}.account_name_to`, '!=', knex.raw('?', accountName));
                });
            });
        })
            .orderBy('tr_executed_at', 'DESC')
            .offset(params.offset)
            .limit(params.limit);
        if (EnvHelper.isProductionEnv()) {
            queryBuilder.whereNotIn('tr_type', [
                BlockchainTrTraces.getTypeUpvoteContent(),
            ]);
        }
        const dbData = await queryBuilder;
        // Hydration
        // #task - use existing library
        for (const current of dbData) {
            const user = {};
            current.User = null;
            for (const field in current) {
                if (field.startsWith(relUserAlias)) {
                    const processedField = field.replace(relUserAlias + delimiter, '');
                    if (user[processedField]) {
                        throw new Error(`User already has field ${processedField}. Probably SQL join is not correct.`);
                    }
                    user[processedField] = current[field];
                }
            }
            if (user.id !== null) {
                current.User = user;
            }
            usersPreviewFields.forEach((field) => {
                delete current[relUserAlias + delimiter + field];
            });
        }
        return dbData;
    }
    static async countAllByAccountNameFromTo(accountName) {
        const res = await knex.count()
            .from(TABLE_NAME)
            .andWhere(function () {
            // @ts-ignore
            this.where('account_name_from', accountName);
            // @ts-ignore
            this.orWhere('account_name_to', accountName);
        })
            .first();
        return +res.count;
    }
}
module.exports = IrreversibleTracesRepository;
