/* tslint:disable:max-line-length */
import { DbParamsDto, RequestQueryDto } from './interfaces/query-filter-interfaces';

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
    if (isNaN(lastId) || lastId <= 0 || query.last_id.includes('.')) {
      throw new BadRequestError(errorObj);
    }
  }

  /**
   *
   * @param {string[][]} orderBy
   * @param {string|null} tableName
   * @returns {string}
   */
  static sequelizeOrderByToKnexRaw(orderBy, tableName = null) {
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

  /**
   * #task use TypeScript interfaces
   *
   */
  static getQueryParametersWithRepository(query, repository) {
    const orderByRelationMap  = repository.getOrderByRelationMap();
    const allowedOrderBy      = repository.getAllowedOrderBy();
    const whereProcessor      = repository.getWhereProcessor();

    return this.getQueryParameters(query, orderByRelationMap, allowedOrderBy, whereProcessor);
  }

  /**
   *
   * @param {Object} query - parsed query string
   * @param {Object} orderByRelationMap
   * @param {string[]|null} allowedSortBy
   * @param {Function|null} whereProcessor
   * @returns {Object}
   */
  static getQueryParameters(query: RequestQueryDto | null, orderByRelationMap = {}, allowedSortBy = null, whereProcessor = null) {
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

  public static getMetadata(
    totalAmount: number,
    query: RequestQueryDto,
    params: DbParamsDto,
  ) {
    return {
      total_amount: totalAmount,
      page:         +query.page,
      per_page:     +query.per_page,
      has_more:     params.offset + params.limit < totalAmount,
    };
  }

  /**
   *
   * @param {Object} query
   * @param {Object} params
   * @private
   */
  private static setOffsetLimit(query, params) {
    const page    = +query.page;
    let perPage   = +query.per_page;

    if (!page || page < 0) {
      return;
    }

    if (!perPage || perPage < 0) {
      return;
    }

    if (perPage > PER_PAGE_LIMIT) {
      perPage = PER_PAGE_LIMIT;
    }

    let offset  = 0;
    if (page > 1) {
      offset = (page - 1) * perPage;
    }

    params.offset = offset;
    params.limit  = perPage;
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
    if (!query.sort_by) {
      return;
    }

    const sorting: string[][] = [];
    query['sort_by'].split(',').forEach((value) => {

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
        toPush = _.concat(orderByRelationMap[valueToSort], sortOrder);
      } else {
        toPush = [
          valueToSort,
          sortOrder,
        ];
      }

      sorting.push(toPush);
    });

    params.order = sorting;
  }
}

export = QueryFilterService;
