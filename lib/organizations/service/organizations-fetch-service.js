"use strict";
const errors_1 = require("../../api/errors");
const OrganizationPostProcessor = require("./organization-post-processor");
const PostsRepository = require("../../posts/posts-repository");
const OrganizationsModelProvider = require("./organizations-model-provider");
const _ = require("lodash");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const EntityListCategoryDictionary = require("../../stats/dictionary/entity-list-category-dictionary");
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
        let data;
        if (query.overview_type && query.entity_name) {
            data = this.getManyOrganizationsListAsRelatedToEntityPromises(query, query.entity_name);
        }
        else {
            data = this.getManyOrganizationsListPromises(query);
        }
        return this.findAndProcessAllByParams(data.promises, query, data.params);
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
    static getManyOrganizationsListPromises(query) {
        const repository = OrganizationsRepository;
        const params = QueryFilterService.getQueryParametersWithRepository(query, repository, true);
        const promises = [
            OrganizationsRepository.findAllOrgForList(params),
            OrganizationsRepository.countAllOrganizations(params),
        ];
        return {
            promises,
            params,
        };
    }
    static getManyOrganizationsListAsRelatedToEntityPromises(query, entityName) {
        if (entityName !== PostsModelProvider.getEntityName()) {
            throw new errors_1.AppError(`Unsupported entityName: ${entityName}`, 500);
        }
        if (!query.post_type_id) {
            throw new errors_1.AppError('post_type_id parameter is required', 400);
        }
        const relatedRepository = PostsRepository;
        const orderByRelationMap = relatedRepository.getOrderByRelationMap(false);
        const allowedOrderBy = relatedRepository.getAllowedOrderBy();
        const whereProcessor = relatedRepository.getWhereProcessor();
        let params = QueryFilterService.getQueryParameters(query, orderByRelationMap, allowedOrderBy, whereProcessor);
        params = _.defaults(params, OrganizationsRepository.getDefaultListParams());
        QueryFilterService.processAttributes(params, OrganizationsModelProvider.getTableName(), true);
        const relEntityFields = 'organization_id';
        const statsFieldName = EntityListCategoryDictionary.getStatsFieldByOverviewType(query.overview_type);
        const promises = [
            OrganizationsRepository.findManyAsRelatedToEntity(params, statsFieldName, relEntityFields, query.overview_type),
            OrganizationsRepository.countManyOrganizationsAsRelatedToEntity(params, statsFieldName, relEntityFields, query.overview_type),
        ];
        return {
            promises,
            params,
        };
    }
}
module.exports = OrganizationsFetchService;
