"use strict";
const BlockchainModelProvider = require("../service/blockchain-model-provider");
const knex = require("../../../config/knex");
const InsertUpdateRepositoryHelper = require("../../common/helper/repository/insert-update-repository-helper");
const RepositoryHelper = require("../../common/repository/repository-helper");
const _ = require('lodash');
const blockchainModelProvider = require('../service/blockchain-model-provider');
const model = blockchainModelProvider.getModel();
const TABLE_NAME = BlockchainModelProvider.getTableName();
const db = require('../../../models').sequelize;
const { Op } = db.Sequelize;
// @ts-ignore - static fields are not allowed to be inside interface. Waiting for typescript updating.
class BlockchainNodesRepository {
    static getQueryBuilder() {
        return knex(TABLE_NAME);
    }
    static async findBlockchainNodeIdsByAccountNames(accountNames) {
        const data = await knex(TABLE_NAME)
            .select(['id', 'title'])
            .whereIn('title', accountNames);
        const indexed = {};
        data.forEach((item) => {
            indexed[item.title] = item.id;
        });
        return indexed;
    }
    static async findBlockchainNodeIdsByObjectIndexedByTitle(indexedObject) {
        return this.findBlockchainNodeIdsByAccountNames(Object.keys(indexedObject));
    }
    /**
     *
     * @param {string[]} existedTitles
     * @return {Promise<*>}
     */
    static async setDeletedAtNotExisted(existedTitles) {
        const prepared = existedTitles.map(item => `'${item}'`);
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
    static async createOrUpdateNodes(indexedData, blockchainNodesType) {
        for (const key in indexedData) {
            if (!indexedData.hasOwnProperty(key)) {
                continue;
            }
            indexedData[key].blockchain_nodes_type = blockchainNodesType;
        }
        const insertSqlPart = InsertUpdateRepositoryHelper.getInsertManyRawSqlFromIndexed(indexedData, TABLE_NAME);
        const sql = `
    ${insertSqlPart}
    ON CONFLICT (title) DO
    UPDATE
        SET votes_count                 = EXCLUDED.votes_count,
            votes_amount                = EXCLUDED.votes_amount,
            scaled_importance_amount    = EXCLUDED.scaled_importance_amount,
            currency                    = EXCLUDED.currency,
            bp_status                   = EXCLUDED.bp_status
    `;
        await knex.raw(sql);
    }
    /**
     * @param {Object} queryParameters
     *
     * @return {Promise<Object>}
     */
    static async findAllBlockchainNodesLegacy(queryParameters = {}) {
        const params = _.defaults(queryParameters, this.getDefaultListParams());
        params.limit = 1000;
        if (!params.where) {
            params.where = {};
        }
        params.where.deleted_at = {
            [Op.eq]: null,
        };
        params.where.bp_status = {
            [Op.in]: [1, 2],
        };
        const data = await model.findAll(Object.assign({ attributes: this.getFieldsForPreview() }, params));
        RepositoryHelper.convertStringFieldsToNumbersForArray(data, this.getNumericalFields());
        return data;
    }
    static getDefaultListParams() {
        return {
            attributes: this.getFieldsForPreview(),
            where: {},
            order: this.getDefaultOrderBy(),
            limit: 10,
            offset: 0,
            raw: true,
        };
    }
    static getFieldsForPreview() {
        return [
            'id',
            'title',
            'votes_count',
            'votes_amount',
            'currency',
            'bp_status',
            'blockchain_nodes_type',
            'scaled_importance_amount',
        ];
    }
    static getDefaultOrderBy() {
        return [
            ['bp_status', 'ASC'],
            ['title', 'ASC'],
        ];
    }
    static getNumericalFields() {
        return [
            'id',
            'votes_amount',
            'scaled_importance_amount',
        ];
    }
    static getFieldsToDisallowZero() {
        return [
            'id',
        ];
    }
    static getAllowedOrderBy() {
        return [
            'id', 'title', 'votes_count', 'votes_amount', 'bp_status',
        ];
    }
    // noinspection JSUnusedGlobalSymbols
    static getOrderByRelationMap() {
        return {};
    }
    static addWhere(query, queryBuilder) {
        if (!query.filters) {
            return;
        }
        if (query.filters.search) {
            // noinspection JSIgnoredPromiseFromCall
            queryBuilder.andWhere('title', 'ilike', `%${query.filters.search}%`);
        }
        if (query.filters.blockchain_nodes_type) {
            // noinspection JSIgnoredPromiseFromCall
            queryBuilder.andWhere('blockchain_nodes_type', '=', +query.filters.blockchain_nodes_type);
        }
        if (query.filters.deleted_at !== true) {
            queryBuilder.whereNull('deleted_at');
        }
    }
    static getWhereProcessor() {
        // @ts-ignore
        return (query, params) => { };
    }
}
module.exports = BlockchainNodesRepository;
