
class QueryFilterService {

  /**
   *
   * @param {Object} query - parsed query string
   * @returns {Object}
   */
  static getQueryParameters(query) {
    let queryParameters = {};

    queryParameters['order'] = this.__getSortedBy(query);

    return queryParameters;
  }

  /**
   *
   * @param {Object} query - parsed query string
   * @returns {Array}
   */
  static __getSortedBy(query) {
    let sorting = [];

    if (!query['sort_by']) {
      sorting.push(['current_rate', 'DESC']);
      sorting.push(['id', 'DESC']);

      return sorting;
    }

    query['sort_by'].split(',').forEach(value => {
      let sortOrder = value[0] === '-' ? 'DESC' : 'ASC';

      sorting.push([
        value.substring(1),
        sortOrder
      ]);
    });

    return sorting;
  }
}

module.exports = QueryFilterService;