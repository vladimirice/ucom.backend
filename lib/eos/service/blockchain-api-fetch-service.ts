const { HttpForbiddenError, BadRequestError }    = require('../../api/errors');
const blockchainNodesRepository = require('../repository').Main;
const Op = require('../../../models').sequelize.Op;

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
  static async getAndProcessNodes(query, userId) {
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
   * @param {Object} queryParams
   * @param {number|null} userId
   * @return {Promise<{dataObjects: Array, votedNodes: Array}>}
   * @private
   */
  private static async getApiDbData(queryParams, userId) {
    let votedNodes  = [];
    let dataObjects = [];

    if (userId) {
      const nodePromise     = blockchainNodesRepository.findAllBlockchainNodes(queryParams);
      const activityPromise = usersActivityRepository.findOneUserBlockchainNodesActivity(userId);

      [dataObjects, votedNodes] = await Promise.all([
        nodePromise,
        activityPromise,
      ]);

    } else {
      dataObjects = await blockchainNodesRepository.findAllBlockchainNodes(queryParams);
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

    for (let m = 0; m < dataObjects.length; m += 1) {
      const model = dataObjects[m];

      if (userId) {
        model.myselfData = {
          bp_vote: !!(~votedNodes.indexOf(model.id)),
        };
      }

      if (userId && myselfBpVoteFilter === true && !model.myselfData.bp_vote) {
        continue;
      }

      model.votes_percentage = +((model.votes_count / totalVotesCount * 100).toFixed(3));

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
