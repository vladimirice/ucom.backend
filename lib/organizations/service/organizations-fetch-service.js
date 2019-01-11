"use strict";
const queryFilterService = require('../../api/filters/query-filter-service');
const organizationsRepository = require('../repository/organizations-repository.js');
const orgPostProcessor = require('./organization-post-processor');
class OrganizationsFetchService {
    /**
     * @param {string} tagTitle
     * @param {Object} query
     */
    static async findAndProcessAllByTagTitle(tagTitle, query) {
        queryFilterService.checkLastIdExistence(query);
        const params = queryFilterService.getQueryParameters(query);
        const promises = [
            organizationsRepository.findAllByTagTitle(tagTitle, params),
            organizationsRepository.countAllByTagTitle(tagTitle),
        ];
        return this.findAndProcessAllByParams(promises, query, params);
    }
    /**
     *
     * @param {Object} query
     * @returns {Promise<Object>}
     */
    static async findAndProcessAll(query) {
        const params = queryFilterService.getQueryParameters(query);
        const data = await organizationsRepository.findAllOrgForList(params);
        orgPostProcessor.processManyOrganizations(data);
        const totalAmount = await organizationsRepository.countAllOrganizations();
        const metadata = queryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
    static async findAndProcessAllByParams(promises, query, params) {
        const [data, totalAmount] = await Promise.all(promises);
        orgPostProcessor.processManyOrganizations(data);
        const metadata = queryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
}
module.exports = OrganizationsFetchService;
