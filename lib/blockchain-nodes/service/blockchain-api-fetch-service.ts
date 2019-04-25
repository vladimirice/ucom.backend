import { QueryBuilder } from 'knex';
import { RequestQueryBlockchainNodes } from '../interfaces/blockchain-nodes-interfaces';
import { QueryFilteredRepository } from '../../api/filters/interfaces/query-filter-interfaces';

const { Dictionary } = require('ucom-libs-wallet');

import BlockchainNodesRepository = require('../repository/blockchain-nodes-repository');
import QueryFilterService = require('../../api/filters/query-filter-service');
import KnexQueryBuilderHelper = require('../../common/helper/repository/knex-query-builder-helper');
import UsersActivityRepository = require('../../users/repository/users-activity-repository');

const { BadRequestError }    = require('../../api/errors');
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
  public static async getAndProcessNodesLegacy(query, userId) {
    this.checkQueryParams(query, userId);

    const queryParams = QueryFilterService.getQueryParameters(
      query,
      {},
      UsersActivityRepository.getAllowedOrderBy(),
    );
    this.setWhereByRequestQueryLegacy(queryParams, query);

    const { dataObjects, votedNodes } = await this.getApiDbDataLegacy(queryParams, userId);

    return this.getDataForApiResponseLegacy(dataObjects, votedNodes, !!query.myself_bp_vote, userId);
  }

  /**
   *
   * @param {Object} query
   */
  public static async getAndProcessNodes(query: RequestQueryBlockchainNodes) {
    this.checkQueryParams(query, query.filters.user_id);

    const repository: QueryFilteredRepository = BlockchainNodesRepository;

    const knexForList: QueryBuilder = BlockchainNodesRepository.getQueryBuilder();
    const knexForCount: QueryBuilder = BlockchainNodesRepository.getQueryBuilder();

    const { offset, limit } = QueryFilterService.addQueryParamsToKnex(query, repository, knexForList);

    if (query.filters.myself_votes_only && query.filters.user_id) {
      const nodeIdsVotedFor: number[] = await UsersActivityRepository.findOneUserBlockchainNodesActivity(
        query.filters.user_id,
        query.filters.blockchain_nodes_type,
      );
      knexForList.whereIn('id', nodeIdsVotedFor);
      knexForCount.whereIn('id', nodeIdsVotedFor);
    }

    const [data, totalAmount] = await Promise.all([
      KnexQueryBuilderHelper.getListByQueryBuilder(repository, knexForList),
      KnexQueryBuilderHelper.countByQueryBuilder(query, repository, knexForCount),
    ]);

    this.addVotesPercentage(data);

    const metadata = QueryFilterService.getMetadataByOffsetLimit(
      totalAmount,
      query.page,
      query.per_page,
      offset,
      limit,
    );

    return {
      data,
      metadata,
    };
  }

  private static addVotesPercentage(data: any): void {
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
  private static async getApiDbDataLegacy(queryParams, userId) {
    let votedNodes: any  = [];
    let dataObjects: any = [];

    if (userId) {
      const nodePromise     = BlockchainNodesRepository.findAllBlockchainNodesLegacy(queryParams);
      const activityPromise = UsersActivityRepository.findOneUserBlockchainNodesActivity(
        userId,
        Dictionary.BlockchainNodes.typeBlockProducer(),
      );

      [dataObjects, votedNodes] = await Promise.all([
        nodePromise,
        activityPromise,
      ]);
    } else {
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
  private static getDataForApiResponseLegacy(dataObjects, votedNodes, myselfBpVoteFilter, userId) {
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
  private static setWhereByRequestQueryLegacy(queryParams, query) {
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
    // backward compatibility for legacy
    if (!!query.myself_bp_vote && !userId) {
      throw new BadRequestError(
        'myself_bp_vote = true parameter is allowed for auth users only or if user_id is given',
      );
    }

    if (query.filters && query.filters.myself_votes_only && !userId) {
      throw new BadRequestError(
        'myself_bp_vote = true parameter is allowed for auth users only or if user_id is given',
      );
    }
  }
}

export = BlockchainApiFetchService;
