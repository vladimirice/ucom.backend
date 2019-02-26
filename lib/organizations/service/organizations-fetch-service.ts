import {
  DbParamsDto,
  QueryFilteredRepository,
  RequestQueryDto,
} from '../../api/filters/interfaces/query-filter-interfaces';
import {
  OrgIdToOrgModelCard, OrgListResponse, OrgModel, OrgModelCard,
} from '../interfaces/model-interfaces';

import { AppError } from '../../api/errors';
import { PostRequestQueryDto } from '../../posts/interfaces/model-interfaces';

import OrganizationPostProcessor = require('./organization-post-processor');
import PostsRepository = require('../../posts/posts-repository');
import OrganizationsModelProvider = require('./organizations-model-provider');
import _ = require('lodash');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import EntityListCategoryDictionary = require('../../stats/dictionary/entity-list-category-dictionary');

const QueryFilterService      = require('../../api/filters/query-filter-service');
const OrganizationsRepository = require('../repository/organizations-repository');
const orgPostProcessor        = require('./organization-post-processor');

class OrganizationsFetchService {
  /**
   * @param {string} tagTitle
   * @param {Object} query
   */
  public static async findAndProcessAllByTagTitle(tagTitle, query) {
    QueryFilterService.checkLastIdExistence(query);
    const params = QueryFilterService.getQueryParameters(query);

    const promises = [
      OrganizationsRepository.findAllByTagTitle(tagTitle, params),
      OrganizationsRepository.countAllByTagTitle(tagTitle),
    ];

    return this.findAndProcessAllByParams(promises, query, params);
  }

  public static async findAndProcessAll(query: RequestQueryDto): Promise<OrgListResponse> {
    let data;
    if (query.overview_type && query.entity_name) {
      data = this.getManyOrganizationsListAsRelatedToEntityPromises(query, query.entity_name);
    } else {
      data = this.getManyOrganizationsListPromises(query);
    }

    return this.findAndProcessAllByParams(data.promises, query, data.params);
  }

  public static async findOneAndProcessForCard(
    modelId: number,
  ): Promise<OrgModelCard | null> {
    const model: OrgModel | null = await OrganizationsRepository.findOneByIdForPreview(modelId);

    if (!model) {
      return null;
    }

    OrganizationPostProcessor.processOneOrgModelCard(model);

    return model;
  }

  public static async findManyAndProcessForCard(
    modelsIds: number[],
  ): Promise<OrgIdToOrgModelCard> {
    const modelsSet: OrgIdToOrgModelCard =
      await OrganizationsRepository.findManyOrgsByIdForCard(modelsIds);

    OrganizationPostProcessor.processOrgIdToOrgModelCard(modelsSet);

    return modelsSet;
  }

  private static async findAndProcessAllByParams(
    promises: Promise<any>[],
    query: RequestQueryDto,
    params: DbParamsDto,
  ): Promise<OrgListResponse> {
    const [data, totalAmount] = await Promise.all(promises);

    orgPostProcessor.processManyOrganizations(data);
    const metadata =  QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }

  private static getManyOrganizationsListPromises(query: RequestQueryDto): { promises: Promise<any>[], params: DbParamsDto } {
    const repository: QueryFilteredRepository = OrganizationsRepository;
    const params: DbParamsDto =
      QueryFilterService.getQueryParametersWithRepository(query, repository, true);

    const promises = [
      OrganizationsRepository.findAllOrgForList(params),
      OrganizationsRepository.countAllOrganizations(params),
    ];

    return {
      promises,
      params,
    };
  }

  private static getManyOrganizationsListAsRelatedToEntityPromises(
    query: PostRequestQueryDto,
    entityName: string,
  ): { promises: Promise<any>[], params: DbParamsDto } {
    if (entityName !== PostsModelProvider.getEntityName()) {
      throw new AppError(`Unsupported entityName: ${entityName}`, 500);
    }

    if (!query.post_type_id) {
      throw new AppError('post_type_id parameter is required', 400);
    }

    const relatedRepository = PostsRepository;

    const orderByRelationMap    = relatedRepository.getOrderByRelationMap(false);
    const allowedOrderBy        = relatedRepository.getAllowedOrderBy();
    const whereProcessor        = relatedRepository.getWhereProcessor();

    let params: DbParamsDto = QueryFilterService.getQueryParameters(query, orderByRelationMap, allowedOrderBy, whereProcessor);
    params = _.defaults(params, OrganizationsRepository.getDefaultListParams());
    QueryFilterService.processAttributes(params, OrganizationsModelProvider.getTableName(), true);

    const relEntityFields = 'organization_id';

    const statsFieldName = EntityListCategoryDictionary.getStatsFieldByOverviewType(query.overview_type!);
    const promises = [
      OrganizationsRepository.findManyAsRelatedToEntity(params, statsFieldName, relEntityFields, query.overview_type!),
      OrganizationsRepository.countManyOrganizationsAsRelatedToEntity(params, statsFieldName, relEntityFields, query.overview_type!),
    ];

    return {
      promises,
      params,
    };
  }
}

export = OrganizationsFetchService;
