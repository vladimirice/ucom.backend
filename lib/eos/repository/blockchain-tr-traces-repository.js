"use strict";
const knex = require('../../../config/knex');
const usersModelProvider = require('../../users/users-model-provider');
const TABLE_NAME = 'blockchain_tr_traces';
// same. They will be different if total resync is required
const TABLE_NAME_RN = 'blockchain_tr_traces';
class BlockchainTrTracesRepository {
    /**
     *
     * @param {Object[]} models
     * @returns {Promise<*>}
     */
    static async insertManyTrTraces(models) {
        const sql = knex(TABLE_NAME_RN).insert(models).toSQL();
        return await knex.raw(sql.sql += ' ON CONFLICT DO NOTHING', sql.bindings);
    }
    /**
     *
     * @param {string} accountName
     * @param {string[]} orderBySet
     * @returns {Promise<Object[]>}
     */
    static async findAllTrTracesWithAllDataByAccountName(accountName, orderBySet) {
        return await knex.select('*')
            .from(TABLE_NAME)
            .andWhere(function () {
            // @ts-ignore
            this.where('account_name_from', accountName);
            // @ts-ignore
            this.orWhere('account_name_to', accountName);
        })
            .orderBy(orderBySet[0], orderBySet[1]);
    }
    /**
     *
     * @param {string} accountName
     * @returns {Promise<number>}
     */
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
    /**
     *
     * @param {string} accountName
     * @param {Object} params
     * @returns {Promise<Object[]>}
     */
    static async findAllByAccountNameFromTo(accountName, params) {
        const relUserAlias = 'rel_user';
        const delimiter = '__';
        const toSelect = [];
        const usersPreviewFields = usersModelProvider.getUserFieldsForPreview();
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
        const dbData = await knex.select(toSelect)
            .from(TABLE_NAME)
            .andWhere(function () {
            // @ts-ignore
            this.where('account_name_from', accountName);
            // @ts-ignore
            this.orWhere('account_name_to', accountName);
        })
            .leftJoin(`Users AS ${relUserAlias}`, function () {
            // @ts-ignore
            this.on(function () {
                // @ts-ignore
                this.on(function () {
                    // @ts-ignore
                    this.on(`${TABLE_NAME}.account_name_from`, '=', `${relUserAlias}.account_name`);
                    // @ts-ignore
                    this.andOn(`${TABLE_NAME}.account_name_from`, '!=', knex.raw('?', accountName));
                });
                // @ts-ignore
                this.orOn(function () {
                    // @ts-ignore
                    this.on(`${TABLE_NAME}.account_name_to`, '=', `${relUserAlias}.account_name`);
                    // @ts-ignore
                    this.andOn(`${TABLE_NAME}.account_name_to`, '!=', knex.raw('?', accountName));
                });
            });
        })
            .orderBy('tr_executed_at', 'DESC')
            .offset(params.offset)
            .limit(params.limit);
        // Hydration
        // #task - use existing library
        for (let i = 0; i < dbData.length; i += 1) {
            const current = dbData[i];
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
    static async setSeqCurrentValByMaxNum() {
        // tslint:disable-next-line:max-line-length
        await knex.raw(`SELECT setval('${TABLE_NAME_RN}_id_seq', (SELECT MAX(id) from "${TABLE_NAME_RN}"));`);
    }
    /**
     * @param {number} trType
     * @returns {Promise<string|null>}
     */
    static async findLastExternalIdByTrType(trType) {
        const res = await knex.select('external_id')
            .from(TABLE_NAME_RN)
            .where({ tr_type: trType })
            .orderBy('id', 'DESC')
            .limit(1)
            .first();
        return res ? res.external_id : null;
    }
}
module.exports = BlockchainTrTracesRepository;
