const _ = require('lodash');

const PER_PAGE_DEFAULT = 1000;

class QueryFilterService {
  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} orderByRelationMap
   * @returns {Object}
   */
  static getQueryParameters(query, orderByRelationMap = {}) {
    let params = {};

    params.where = {};

    this._setOffsetLimit(query, params);
    this._getOrderBy(query, params, orderByRelationMap);

    return params;
  }

  /**
   *
   * @param {Object} query
   * @param {Object} params
   * @private
   */
  static _setOffsetLimit(query, params) {
    let limit   = query.per_page || PER_PAGE_DEFAULT;
    let offset  = 0;

    if (+query.page > 1) {
      offset = (+query.page - 1) * limit;
    }

    params.offset = offset;
    params.limit  = limit;
  }

  /**
   *
   * @param {Object} query
   * @return {Object}
   */
  static getConditionsByQuery(query = null) {
    if (!query) {
      return {};
    }

    return {
      where:  query.where,
      limit:  query.limit,
      offset: query.offset,
      order:  query.order,
    };
  }


  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} params
   * @param {Object} orderByRelationMap
   * @returns {void}
   */
  static _getOrderBy(query, params, orderByRelationMap) {
    let sorting = [];

    if (!query.sort_by) {
      sorting.push(['current_rate', 'DESC']);
      sorting.push(['id', 'DESC']);

      params.order = sorting;

      return;
    }

    query['sort_by'].split(',').forEach(value => {

      let sortOrder = 'ASC';
      let valueToSort = value;

      if (value[0] === '-') {
        sortOrder = 'DESC';
        valueToSort = value.substring(1);
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