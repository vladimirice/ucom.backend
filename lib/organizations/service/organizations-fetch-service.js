"use strict";
const OrganizationPostProcessor = require("./organization-post-processor");
const QueryFilterService = require('../../api/filters/query-filter-service');
const OrganizationsRepository = require('../repository/organizations-repository');
const orgPostProcessor = require('./organization-post-processor');
class OrganizationsFetchService {
    /**
     * @param {string} tagTitle
     * @param {Object} query
     */
    static async findAndProcessAllByTagTitle(tagTitle, query) {
        QueryFilterService.checkLastIdExistence(query);
        const params = QueryFilterService.getQueryParameters(query);
        const promises = [
            OrganizationsRepository.findAllByTagTitle(tagTitle, params),
            OrganizationsRepository.countAllByTagTitle(tagTitle),
        ];
        return this.findAndProcessAllByParams(promises, query, params);
    }
    static async findAndProcessAll(query) {
        const repository = OrganizationsRepository;
        const params = QueryFilterService.getQueryParametersWithRepository(query, repository, true);
        const promises = [
            OrganizationsRepository.findAllOrgForList(params),
            OrganizationsRepository.countAllOrganizations(params),
        ];
        return this.findAndProcessAllByParams(promises, query, params);
    }
    static async findOneAndProcessForCard(modelId) {
        const model = await OrganizationsRepository.findOneByIdForPreview(modelId);
        if (!model) {
            return null;
        }
        OrganizationPostProcessor.processOneOrgModelCard(model);
        return model;
    }
    static async findManyAndProcessForCard(modelsIds) {
        const modelsSet = await OrganizationsRepository.findManyOrgsByIdForCard(modelsIds);
        OrganizationPostProcessor.processOrgIdToOrgModelCard(modelsSet);
        return modelsSet;
    }
    static async findAndProcessAllByParams(promises, query, params) {
        const [data, totalAmount] = await Promise.all(promises);
        orgPostProcessor.processManyOrganizations(data);
        const metadata = QueryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
}
module.exports = OrganizationsFetchService;
