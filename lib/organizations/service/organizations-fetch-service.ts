import {
  DbParamsDto,
  QueryFilteredRepository,
  RequestQueryDto,
} from '../../api/filters/interfaces/query-filter-interfaces';
import {
  OrgIdToOrgModelCard, OrgListResponse, OrgModel, OrgModelCard,
} from '../interfaces/model-interfaces';

import OrganizationPostProcessor = require('./organization-post-processor');

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
    const repository: QueryFilteredRepository = OrganizationsRepository;

    const params: DbParamsDto =
      QueryFilterService.getQueryParametersWithRepository(query, repository, true);

    const promises: Promise<any>[] = [
      OrganizationsRepository.findAllOrgForList(params),
      OrganizationsRepository.countAllOrganizations(params),
    ];

    return this.findAndProcessAllByParams(promises, query, params);
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
}

export = OrganizationsFetchService;
