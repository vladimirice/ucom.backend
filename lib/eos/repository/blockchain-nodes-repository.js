"use strict";
const blockchainModelProvider = require('../service/blockchain-model-provider');
const model = blockchainModelProvider.getModel();
const TABLE_NAME = blockchainModelProvider.getTableName();
const db = require('../../../models').sequelize;
const { Op } = db.Sequelize;
const _ = require('lodash');
class BlockchainNodesRepository {
    /**
     *
     * @param {string[]} accountNames
     * @return {Promise<Object>}
     */
    static async findBlockchainNodeIdsByAccountNames(accountNames) {
        const data = await model.findAll({
            attributes: ['id', 'title'],
            where: {
                title: {
                    [Op.in]: accountNames,
                },
            },
            raw: true,
        });
        const result = {};
        data.forEach((model) => {
            result[model.title] = model.id;
        });
        return result;
    }
    /**
     *
     * @param {string[]} existedTitles
     * @return {Promise<*>}
     */
    static async setDeletedAtNotExisted(existedTitles) {
        const prepared = existedTitles.map((item) => {
            return `'${item}'`;
        });
        const sql = `
      UPDATE ${TABLE_NAME}
      SET deleted_at = NOW(),
          title = title || '_deleted_' || NOW()
      WHERE
        title NOT IN (${prepared.join(', ')})
        AND deleted_at IS NULL
    `;
        return db.query(sql);
    }
    /**
     *
     * @param {Object} data
     * @return {Promise<void>}
     */
    static async createOrUpdateNodes(data) {
        const keys = Object.keys(data[0]).join(', ');
        const values = [];
        for (let i = 0; i < data.length; i += 1) {
            const m = [];
            Object.values(data[i]).forEach((item) => {
                if (typeof item === 'string') {
                    m.push(`'${item}'`);
                }
                else {
                    m.push(item);
                }
            });
            values.push(`(${m.join(', ')})`);
        }
        let valuesString = values.join(', ');
        valuesString = valuesString.substring(1);
        valuesString = valuesString.slice(0, -1);
        const sql = `
    INSERT INTO ${TABLE_NAME}
      (${keys})
    VALUES (${valuesString})
    ON CONFLICT (title) DO
    UPDATE
        SET votes_count   = EXCLUDED.votes_count,
            votes_amount  = EXCLUDED.votes_amount,
            currency      = EXCLUDED.currency,
            bp_status     = EXCLUDED.bp_status
    `;
        await db.query(sql);
        await db.query(`SELECT setval('${TABLE_NAME}_id_seq', MAX(id), true) FROM ${TABLE_NAME}`);
    }
    /**
     * @param {Object} queryParameters
     *
     * @return {Promise<Object>}
     */
    static async findAllBlockchainNodes(queryParameters = {}) {
        const params = _.defaults(queryParameters, this.getDefaultListParams());
        if (!params.where) {
            params.where = {};
        }
        params.where.deleted_at = {
            [Op.eq]: null,
        };
        const data = await model.findAll(Object.assign({ attributes: blockchainModelProvider.getFieldsForPreview() }, params));
        data.forEach((item) => {
            item.votes_amount = +item.votes_amount;
        });
        return data;
    }
    static getDefaultListParams() {
        return {
            where: {},
            order: this.getDefaultOrderBy(),
            raw: true,
        };
    }
    static getDefaultOrderBy() {
        return [
            ['bp_status', 'ASC'],
            ['title', 'ASC'],
        ];
    }
}
module.exports = BlockchainNodesRepository;
