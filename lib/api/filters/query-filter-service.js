const models = reqlib('/models');

class QueryFilterService {

  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} orderByRelationMap
   * @returns {Object}
   */
  static getQueryParameters(query, orderByRelationMap) {
    let queryParameters = {};

    queryParameters['order'] = this.__getOrderBy(query, orderByRelationMap);

    return queryParameters;
  }

  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} orderByRelationMap
   * @returns {Array}
   */
  static __getOrderBy(query, orderByRelationMap) {
    let sorting = [];

    if (!query['sort_by']) {
      sorting.push(['current_rate', 'DESC']);
      sorting.push(['id', 'DESC']);

      return sorting;
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
        toPush = [
          models.sequelize.literal(`${orderByRelationMap[valueToSort]} ${sortOrder}`)
        ];
      } else {
        toPush = [
          valueToSort,
          sortOrder
        ];
      }

      sorting.push(toPush);
    });

    return sorting;
  }
}

module.exports = QueryFilterService;