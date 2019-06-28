/* tslint:disable:max-line-length */
import { QueryBuilder } from 'knex';
import {
  DbParamsDto,
  InputQueryDto,
  QueryFilteredRepository,
  RequestQueryDto,
} from './interfaces/query-filter-interfaces';
import { ListMetadata } from '../../common/interfaces/lists-interfaces';
import { AppError } from '../errors';

const _ = require('lodash');

const { BadRequestError } = require('../../api/errors');

const PER_PAGE_LIMIT = 50;

class QueryFilterService {
  /**
   *
   * @param {Object} query
   */
  static checkLastIdExistence(query: RequestQueryDto) {
    const page = query.page ? +query.page : null;

    if (!page || page <= 1) {
      return;
    }

    const errorObj = {
      last_id: `Last Id is required and must be correct when page parameter is more than 1. Provided value is: ${query.last_id}`,
    };

    if (!query.last_id) {
      throw new BadRequestError(errorObj);
    }

    const lastId = +query.last_id;
    if (Number.isNaN(lastId) || lastId <= 0 || query.last_id.includes('.')) {
      throw new BadRequestError(errorObj);
    }
  }

  /**
   *
   * @param {string[][]} orderBy
   * @param {string|null} tableName
   * @returns {string}
   */
  public static sequelizeOrderByToKnexRaw(orderBy, tableName = null) {
    const arraysSet: string[] = [];
    orderBy.forEach((set) => {
      if (tableName) {
        arraysSet.push(`${tableName}.${set[0]} ${set[1]}`);
      } else {
        arraysSet.push(`${set[0]} ${set[1]}`);
      }
    });

    return arraysSet.join(', ');
  }

  // This is a legacy. Consider to move to getQueryBuilderFilteredByRequestQuery filtering
  public static addWhereRawParamToKnexQuery(
    queryBuilder: QueryBuilder,
    params: DbParamsDto,
  ): void {
    if (params.whereRaw) {
      queryBuilder.whereRaw(params.whereRaw);
    }
  }

  public static addParamsToKnexQuery(
    queryBuilder: QueryBuilder,
    params: DbParamsDto,
  ): void {
    if (!params.orderByRaw && params.order) {
      params.orderByRaw = QueryFilterService.sequelizeOrderByToKnexRaw(params.order);
    }

    this.addWhereRawParamToKnexQuery(queryBuilder, params);

    if (params.orderByRaw) {
      // noinspection JSIgnoredPromiseFromCall
      queryBuilder.orderByRaw(params.orderByRaw);
    }

    if (params.attributes) {
      queryBuilder.select(params.attributes);
    }

    queryBuilder
      .limit(params.limit || PER_PAGE_LIMIT)
      .offset(params.offset || 0)
    ;
  }

  public static addQueryParamsToKnex(
    query: InputQueryDto,
    repository: QueryFilteredRepository,
    knex: QueryBuilder,
  ): {offset, limit} {
    knex.select(repository.getFieldsForPreview());

    const { offset, limit } = this.getOffsetLimit(query);

    knex.offset(offset);
    knex.limit(limit);

    const sequelizeOrderBy = this.getSequelizeOrderBy(query, {}, repository.getAllowedOrderBy());
    knex.orderByRaw(this.sequelizeOrderByToKnexRaw(sequelizeOrderBy));

    repository.addWhere(query, knex);

    return {
      offset,
      limit,
    };
  }

  public static getQueryParametersWithRepository(
    query: RequestQueryDto | InputQueryDto,
    repository: QueryFilteredRepository,
    processAttributes = false, // hardcoded variable in order to reduce refactoring at the beginning
    processInclude = false, // hardcoded variable in order to reduce refactoring at the beginning
    processOrderByRaw = false,
    forKnexOnly = false,
  ): DbParamsDto {
    const orderByRelationMap    = repository.getOrderByRelationMap();
    const allowedOrderBy        = repository.getAllowedOrderBy();
    const whereProcessor        = repository.getWhereProcessor();

    const givenParams = this.getQueryParameters(
      query,
      orderByRelationMap,
      allowedOrderBy,
      whereProcessor,
    );

    let params = givenParams;
    if (processAttributes) {
      const defaultParams = repository.getDefaultListParams();
      params = _.defaults(givenParams, defaultParams);
    }

    if (processInclude) {
      const includeProcessor = repository.getIncludeProcessor();
      includeProcessor(query, params);
    }

    if (processOrderByRaw) {
      params.orderByRaw = this.sequelizeOrderByToKnexRaw(params.order);
    }

    if (forKnexOnly) {
      delete params.order;
    }

    return params;
  }

  public static addExtraAttributes(
    params: DbParamsDto,
    extraAttributes: string[],
    prefix: string = '',
  ): void {
    if (!params.attributes) {
      throw new AppError('In order to add extra attributes add main attributes beforehand');
    }

    for (const attribute of extraAttributes) {
      const value = prefix !== '' ? `${prefix}.${attribute} AS ${attribute}` : attribute;

      params.attributes.push(value);
    }
  }

  public static processAttributes(
    params: DbParamsDto,
    mainTableName: string,
    prefixAll = false,
  ): void {
    if (!params.attributes) {
      return;
    }

    params.attributes = this.getPrefixedAttributes(params.attributes, mainTableName, prefixAll);
  }

  public static getPrefixedAttributes(
    attributes: string[],
    prefix: string,
    prefixAll = false,
    prefixForAlias: string = '',
  ): string[] {
    const paramsToAddPrefix = [
      'id',
      'created_at',
      'updated_at',
    ];

    return attributes.map((attribute) => {
      if (prefixAll || ~paramsToAddPrefix.indexOf(attribute)) {
        return `${prefix}.${attribute} AS ${prefixForAlias}${attribute}`;
      }

      return attribute;
    });
  }

  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} orderByRelationMap
   * @param {string[]|null} allowedSortBy
   * @param {Function|null} whereProcessor
   * @returns {Object}
   */
  static getQueryParameters(
    query: RequestQueryDto | null,
    orderByRelationMap = {},
    allowedSortBy: string[] | null = null,
    whereProcessor: Function | null = null,
  ) {
    const params: any = {};

    params.where = {};
    if (whereProcessor) {
      // @ts-ignore
      whereProcessor(query, params);
    }

    this.setOffsetLimit(query, params);
    this.setOrderBy(query, params, orderByRelationMap, allowedSortBy);

    return params;
  }

  public static processWithIncludeProcessor(
    repository,
    query: RequestQueryDto,
    params: DbParamsDto,
  ): void {
    const includeProcessor = repository.getIncludeProcessor();
    includeProcessor(query, params);
  }

  public static getMetadata(
    totalAmount: number,
    query: RequestQueryDto,
    params: DbParamsDto,
  ): ListMetadata {
    return this.getMetadataByOffsetLimit(
      totalAmount,
      +query.page,
      +query.per_page,

      params.offset,
      params.limit,
    );
  }

  public static getMetadataByOffsetLimit(
    totalAmount: number,
    page: number,
    perPage: number,
    offset: number,
    limit: number,
  ): ListMetadata {
    return {
      page,
      total_amount: totalAmount,
      per_page: perPage,
      has_more: offset + limit < totalAmount,
    };
  }

  private static getOffsetLimit(query: RequestQueryDto): {offset: number, limit: number} {
    const response = {
      offset: 0,
      limit: PER_PAGE_LIMIT,
    };

    const page = +query.page;
    let perPage = +query.per_page;

    if (!page || page < 0) {
      return response;
    }

    if (!perPage || perPage < 0) {
      return response;
    }

    if (perPage > PER_PAGE_LIMIT) {
      perPage = PER_PAGE_LIMIT;
    }

    if (page > 1) {
      response.offset = this.getOffsetByPagePerPage(page, perPage);
    }

    response.limit = perPage;

    return response;
  }

  /**
   *
   * @param {Object} query
   * @param {Object} params
   * @private
   */
  private static setOffsetLimit(query, params) {
    const { offset, limit } = this.getOffsetLimit(query);

    params.offset = offset;
    params.limit = limit;
  }

  public static getOffsetByPagePerPage(page: number, perPage: number): number {
    return (page - 1) * perPage;
  }

  private static getSequelizeOrderBy(query, orderByRelationMap, allowedSortBy: any = null): any {
    // backward compatibility
    const indexKey = query.sort_by ? 'sort_by' : 'order_by';

    if (!query[indexKey]) {
      return null;
    }

    const sorting: string[][] = [];
    query[indexKey].split(',').forEach((value) => {
      let sortOrder = 'ASC';
      let valueToSort: string = value;

      if (value[0] === '-') {
        sortOrder = 'DESC';
        valueToSort = value.substring(1);
      }

      if (allowedSortBy !== null && !(~allowedSortBy!.indexOf(valueToSort))) {
        const errorMsg = allowedSortBy.length > 0 ? `sort_by field ${valueToSort} is not supported. Supported fields are: ${allowedSortBy.join(', ')}`
          : 'sort_by is not supported yet';

        throw new BadRequestError(errorMsg);
      }

      let toPush: string[] = [];

      if (orderByRelationMap[valueToSort]) {
        toPush = Array.prototype.concat(orderByRelationMap[valueToSort], sortOrder);
      } else {
        toPush = [
          valueToSort,
          sortOrder,
        ];
      }

      sorting.push(toPush);
    });

    return sorting;
  }

  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} params
   * @param {Object} orderByRelationMap
   * @param {string[]} allowedSortBy
   * @returns {void}
   */
  private static setOrderBy(query, params, orderByRelationMap, allowedSortBy: any = null) {
    const orderBy = this.getSequelizeOrderBy(query, orderByRelationMap, allowedSortBy);

    if (orderBy !== null) {
      params.order = this.getSequelizeOrderBy(query, orderByRelationMap, allowedSortBy);
    }
  }
}

export = QueryFilterService;
