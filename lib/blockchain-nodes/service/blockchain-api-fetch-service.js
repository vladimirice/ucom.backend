"use strict";
const { Dictionary } = require('ucom-libs-wallet');
const BlockchainNodesRepository = require("../repository/blockchain-nodes-repository");
const QueryFilterService = require("../../api/filters/query-filter-service");
const KnexQueryBuilderHelper = require("../../common/helper/repository/knex-query-builder-helper");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const { BadRequestError } = require('../../api/errors');
const { Op } = require('../../../models').Sequelize;
/**
 * Fetch-only class. This class should not change anything, only read
 */
class BlockchainApiFetchService {
    /**
     *
     * @param {Object} query
     * @param {number|null} userId
     */
    static async getAndProcessNodesLegacy(query, userId) {
        this.checkQueryParams(query, userId);
        const queryParams = QueryFilterService.getQueryParameters(query, {}, UsersActivityRepository.getAllowedOrderBy());
        this.setWhereByRequestQueryLegacy(queryParams, query);
        const { dataObjects, votedNodes } = await this.getApiDbDataLegacy(queryParams, userId);
        return this.getDataForApiResponseLegacy(dataObjects, votedNodes, !!query.myself_bp_vote, userId);
    }
    /**
     *
     * @param {Object} query
     */
    static async getAndProcessNodes(query) {
        this.checkQueryParams(query, query.filters.user_id);
        const repository = BlockchainNodesRepository;
        const knexForList = BlockchainNodesRepository.getQueryBuilder();
        const knexForCount = BlockchainNodesRepository.getQueryBuilder();
        const { offset, limit } = QueryFilterService.addQueryParamsToKnex(query, repository, knexForList);
        if (query.filters.myself_votes_only && query.filters.user_id) {
            const nodeIdsVotedFor = await UsersActivityRepository.findOneUserBlockchainNodesActivity(query.filters.user_id, query.filters.blockchain_nodes_type);
            knexForList.whereIn('id', nodeIdsVotedFor);
            knexForCount.whereIn('id', nodeIdsVotedFor);
        }
        const [data, totalAmount] = await Promise.all([
            KnexQueryBuilderHelper.getListByQueryBuilder(repository, knexForList),
            KnexQueryBuilderHelper.countByQueryBuilder(query, repository, knexForCount),
        ]);
        this.addVotesPercentage(data);
        const metadata = QueryFilterService.getMetadataByOffsetLimit(totalAmount, query.page, query.per_page, offset, limit);
        return {
            data,
            metadata,
        };
    }
    static addVotesPercentage(data) {
        const totalVotesCount = data.reduce((prev, cur) => prev + cur.votes_count, 0);
        for (const model of data) {
            model.votes_percentage = +((model.votes_count / totalVotesCount * 100).toFixed(3));
        }
    }
    /**
     *
     * @param {Object} queryParams
     * @param {number|null} userId
     * @return {Promise<{dataObjects: Array, votedNodes: Array}>}
     * @private
     */
    static async getApiDbDataLegacy(queryParams, userId) {
        let votedNodes = [];
        let dataObjects = [];
        if (userId) {
            const nodePromise = BlockchainNodesRepository.findAllBlockchainNodesLegacy(queryParams);
            const activityPromise = UsersActivityRepository.findOneUserBlockchainNodesActivity(userId, Dictionary.BlockchainNodes.typeBlockProducer());
            [dataObjects, votedNodes] = await Promise.all([
                nodePromise,
                activityPromise,
            ]);
        }
        else {
            dataObjects = await BlockchainNodesRepository.findAllBlockchainNodesLegacy(queryParams);
        }
        return {
            dataObjects,
            votedNodes,
        };
    }
    /**
     *
     * @param {Object[]} dataObjects
     * @param {number[]} votedNodes
     * @param {boolean} myselfBpVoteFilter
     * @param {number|null} userId
     * @private
     */
    static getDataForApiResponseLegacy(dataObjects, votedNodes, myselfBpVoteFilter, userId) {
        const data = [];
        const totalVotesCount = dataObjects.reduce((prev, cur) => prev + cur.votes_count, 0);
        for (const model of dataObjects) {
            if (userId) {
                model.myselfData = {
                    bp_vote: !!(~votedNodes.indexOf(model.id)),
                };
            }
            if (userId && myselfBpVoteFilter === true && !model.myselfData.bp_vote) {
                continue;
            }
            model.votes_percentage = +((model.votes_count / totalVotesCount * 100).toFixed(3));
            model.scaled_importance_amount = +model.scaled_importance_amount;
            data.push(model);
        }
        const metadata = {
            total_amount: dataObjects.length,
            page: 1,
            per_page: dataObjects.length,
            has_more: false,
        };
        return {
            data,
            metadata,
        };
    }
    /**
     *
     * @param {Object} queryParams
     * @param {Object} query
     */
    static setWhereByRequestQueryLegacy(queryParams, query) {
        if (query.search) {
            queryParams.where.title = {
                [Op.iLike]: `%${query.search}%`,
            };
        }
        if (query.blockchain_nodes_type) {
            queryParams.where.blockchain_nodes_type = +query.blockchain_nodes_type;
        }
    }
    /**
     *
     * @param {Object} query
     * @param {number|null} userId
     * @private
     */
    static checkQueryParams(query, userId) {
        // backward compatibility for legacy
        if (!!query.myself_bp_vote && !userId) {
            throw new BadRequestError('myself_bp_vote = true parameter is allowed for auth users only or if user_id is given');
        }
        if (query.filters && query.filters.myself_votes_only && !userId) {
            throw new BadRequestError('myself_bp_vote = true parameter is allowed for auth users only or if user_id is given');
        }
    }
}
module.exports = BlockchainApiFetchService;
