const { HttpForbiddenError, BadRequestError }    = require('../../api/errors');
const BlockchainNodesRepository = require('../repository').Main;
const Op = require('../../../models').sequelize.Op;

const UsersActivityRepository = require('../../../lib/users/repository').Activity;

const QueryFilterService = require('../../api/filters/query-filter-service');

/**
 * Fetch-only class. This class should not change anything, only read
 */
class BlockchainApiFetchService {
  /**
   *
   * @param {Object} query
   * @param {number|null} userId
   * @return {Promise<{data: Array, metadata: {total_amount: *, page: number, per_page: *, has_more: boolean}}>}
   */
  static async getAndProcessNodes(query, userId) {
    this._checkQueryParams(query, userId);

    let queryParams = QueryFilterService.getQueryParameters(query, {}, UsersActivityRepository.getAllowedOrderBy());
    this._setWhereByRequestQuery(queryParams, query);

    const {dataObjects, votedNodes} = await this._getApiDbData(queryParams, userId);

    return this._getDataForApiResponse(dataObjects, votedNodes, !!query.myself_bp_vote);
  }

  /**
   *
   * @param {Object} queryParams
   * @param {number|null} userId
   * @return {Promise<{dataObjects: Array, votedNodes: Array}>}
   * @private
   */
  static async _getApiDbData(queryParams, userId) {
    let votedNodes  = [];
    let dataObjects = [];

    if (userId) {
      const nodePromise     = BlockchainNodesRepository.findAllBlockchainNodes(queryParams);
      const activityPromise = UsersActivityRepository.findOneUserBlockchainNodesActivity(userId);

      [dataObjects, votedNodes] = await Promise.all([
        nodePromise,
        activityPromise,
      ]);

    } else {
      dataObjects = await BlockchainNodesRepository.findAllBlockchainNodes(queryParams);
    }

    return {
      dataObjects,
      votedNodes,
    }
  }

  /**
   *
   * @param {Object[]} dataObjects
   * @param {number[]} votedNodes
   * @param {boolean} myselfBpVoteFilter
   * @return {{data: Array, metadata: {total_amount: *, page: number, per_page: *, has_more: boolean}}}
   * @private
   */
  static _getDataForApiResponse(dataObjects, votedNodes, myselfBpVoteFilter) {
    let data = [];
    for (let m = 0; m < dataObjects.length; m++) {
      const model = dataObjects[m];

      if (votedNodes.length > 0) {
        model.myselfData = {
          bp_vote: !!(~votedNodes.indexOf(model.id)),
        }
      }

      if (votedNodes.length > 0 && myselfBpVoteFilter && model.myselfData.bp_vote === false) {
        continue;
      }

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
      metadata
    }
  }

  /**
   *
   * @param {Object} queryParams
   * @param {Object} query
   */
  static _setWhereByRequestQuery(queryParams, query) {
    if (query.search) {
      queryParams.where.title = {
        [Op.iLike]: `%${query.search}%`
      }
    }
  }

  /**
   *
   * @param {Object} query
   * @param {number|null} userId
   * @private
   */
  static _checkQueryParams(query, userId) {
    if (!!query.myself_bp_vote && !userId) {
      throw new HttpForbiddenError('myself_bp_vote = true parameter is allowed for auth users only');
    }

    if (query.page || query.per_page) {
      throw new BadRequestError('Pagination is not supported yet. It is forbidden to send page and per_page');
    }
  }
}

module.exports = BlockchainApiFetchService;