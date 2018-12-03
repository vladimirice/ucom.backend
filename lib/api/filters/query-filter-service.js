const _ = require('lodash');

const { BadRequestError } = require('../../api/errors');

const PER_PAGE_LIMIT = 50;

class QueryFilterService {
  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} orderByRelationMap
   * @param {string[]|null} allowedSortBy
   * @returns {Object}
   */
  static getQueryParameters(query, orderByRelationMap = {}, allowedSortBy = null) {
    let params = {};

    this._setWhere(query, params);
    this._setOffsetLimit(query, params);
    this._setOrderBy(query, params, orderByRelationMap, allowedSortBy);

    return params;
  }

  /**
   *
   * @param {Object} query
   * @param {Object} params
   * @private
   */
  static _setWhere(query, params) {
    params.where = {};

    // TODO - hardcoded
    if (query.post_type_id) {
      params.where.post_type_id = +query.post_type_id;
    }
  }

  /**
   *
   * @param {number} totalAmount
   * @param {Object} query
   * @param {Object} params
   * @return {{total_amount: *, page: number, per_page: number, has_more: boolean}}
   */
  static getMetadata(totalAmount, query, params) {
   return {
      total_amount: totalAmount,
      page:         +query.page,
      per_page:     +query.per_page,
      has_more:     params.offset + params.limit < totalAmount,
    };
  }

  /**
   *
   * @param {Object} query
   * @param {Object} params
   * @private
   */
  static _setOffsetLimit(query, params) {
    const page    = +query.page;
    let perPage   = +query.per_page;

    if (!page || page < 0) {
      return;
    }

    if (!perPage || perPage < 0) {
      return;
    }

    if (perPage > PER_PAGE_LIMIT) {
      perPage = PER_PAGE_LIMIT;
    }

    let offset  = 0;
    if (page > 1) {
      offset = (page - 1) * perPage;
    }

    params.offset = offset;
    params.limit  = perPage;
  }

  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} params
   * @param {Object} orderByRelationMap
   * @param {string[]} allowedSortBy
   * @returns {void}
   */
  static _setOrderBy(query, params, orderByRelationMap, allowedSortBy = null) {
    if (!query.sort_by) {
      return;
    }

    let sorting = [];
    query['sort_by'].split(',').forEach(value => {

      let sortOrder = 'ASC';
      let valueToSort = value;

      if (value[0] === '-') {
        sortOrder = 'DESC';
        valueToSort = value.substring(1);
      }

      if (allowedSortBy !== null && !(~allowedSortBy.indexOf(valueToSort))) {
        const errorMsg = allowedSortBy.length > 0 ? `sort_by field ${valueToSort} is not supported. Supported fields are: ${allowedSortBy.join(', ')}`
          : 'sort_by is not supported yet';

        throw new BadRequestError(errorMsg);
      }

      let toPush = [];

      if (orderByRelationMap[valueToSort]) {
        toPush = _.concat(orderByRelationMap[valueToSort], sortOrder);
      } else {
        toPush = [
          valueToSort,
          sortOrder
        ];
      }

      sorting.push(toPush);
    });

    params.order = sorting;
  }
}

module.exports = QueryFilterService;