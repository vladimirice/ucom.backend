import { QueryBuilder } from 'knex';
import { RequestQueryBlockchainNodes } from '../interfaces/blockchain-nodes-interfaces';
import { QueryFilteredRepository } from '../../api/filters/interfaces/query-filter-interfaces';

import BlockchainNodesRepository = require('../repository/blockchain-nodes-repository');
import QueryFilterService = require('../../api/filters/query-filter-service');

const { HttpForbiddenError, BadRequestError }    = require('../../api/errors');
const blockchainNodesRepository = require('../repository').Main;
const { Op } = require('../../../models').Sequelize;

const usersActivityRepository = require('../../../lib/users/repository').Activity;

const queryFilterService = require('../../api/filters/query-filter-service');

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

    const queryParams = queryFilterService.getQueryParameters(
      query,
      {},
      usersActivityRepository.getAllowedOrderBy(),
    );
    this.setWhereByRequestQuery(queryParams, query);

    const { dataObjects, votedNodes } = await this.getApiDbData(queryParams, userId);

    return this.getDataForApiResponse(dataObjects, votedNodes, !!query.myself_bp_vote, userId);
  }

  /**
   *
   * @param {Object} query
   */
  static async getAndProcessNodes(query: RequestQueryBlockchainNodes) {
    const repository: QueryFilteredRepository = BlockchainNodesRepository;

    const knex: QueryBuilder = BlockchainNodesRepository.getQueryBuilder();

    QueryFilterService.addQueryParamsToKnex(query, repository, knex);

    // @ts-ignore
    const sql = knex.toSQL();

    return await knex;
  }

  /**
   *
   * @param {Object} queryParams
   * @param {number|null} userId
   * @return {Promise<{dataObjects: Array, votedNodes: Array}>}
   * @private
   */
  private static async getApiDbData(queryParams, userId) {
    let votedNodes  = [];
    let dataObjects = [];

    if (userId) {
      const nodePromise     = blockchainNodesRepository.findAllBlockchainNodesLegacy(queryParams);
      const activityPromise = usersActivityRepository.findOneUserBlockchainNodesActivity(userId);

      [dataObjects, votedNodes] = await Promise.all([
        nodePromise,
        activityPromise,
      ]);
    } else {
      dataObjects = await blockchainNodesRepository.findAllBlockchainNodesLegacy(queryParams);
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
  private static getDataForApiResponse(dataObjects, votedNodes, myselfBpVoteFilter, userId) {
    const data: any = [];
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
  private static setWhereByRequestQuery(queryParams, query) {
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
  private static checkQueryParams(query, userId) {
    if (!!query.myself_bp_vote && !userId) {
      throw new HttpForbiddenError(
        'myself_bp_vote = true parameter is allowed for auth users only',
      );
    }

    if (query.page || query.per_page) {
      throw new BadRequestError(
        'Pagination is not supported yet. It is forbidden to send page and per_page',
      );
    }
  }
}

export = BlockchainApiFetchService;
