const QueryFilterService      = require('../../api/filters/query-filter-service');
const OrganizationsRepository = require('../repository/organizations-repository');
const OrgPostProcessor        = require('./organization-post-processor');

class OrganizationsFetchService {
  /**
   *
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  static async findAndProcessAll(query) {
    let params = QueryFilterService.getQueryParameters(query);

    const models = await OrganizationsRepository.findAllOrgForList(params);
    OrgPostProcessor.processManyOrganizations(models);

    const totalAmount = await OrganizationsRepository.countAllOrganizations();
    const metadata    =  QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data :    models,
      metadata: metadata,
    };
  }
}

module.exports = OrganizationsFetchService;