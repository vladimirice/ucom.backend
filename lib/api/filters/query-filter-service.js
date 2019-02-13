"use strict";
const _ = require('lodash');
const { BadRequestError } = require('../../api/errors');
const PER_PAGE_LIMIT = 50;
class QueryFilterService {
    /**
     *
     * @param {Object} query
     */
    static checkLastIdExistence(query) {
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
    static sequelizeOrderByToKnexRaw(orderBy, tableName = null) {
        const arraysSet = [];
        orderBy.forEach((set) => {
            if (tableName) {
                arraysSet.push(`${tableName}.${set[0]} ${set[1]}`);
            }
            else {
                arraysSet.push(`${set[0]} ${set[1]}`);
            }
        });
        return arraysSet.join(', ');
    }
    static addParamsToKnexQuery(query, params) {
        if (!params.orderByRaw && params.order) {
            params.orderByRaw = this.sequelizeOrderByToKnexRaw(params.order);
        }
        if (params.orderByRaw) {
            // noinspection JSIgnoredPromiseFromCall
            query.orderByRaw(params.orderByRaw);
        }
        // noinspection JSIgnoredPromiseFromCall
        query
            .select(params.attributes)
            .limit(params.limit || PER_PAGE_LIMIT)
            .offset(params.offset || 0);
    }
    static getQueryParametersWithRepository(query, repository, processAttributes = false) {
        const orderByRelationMap = repository.getOrderByRelationMap();
        const allowedOrderBy = repository.getAllowedOrderBy();
        const whereProcessor = repository.getWhereProcessor();
        const givenParams = this.getQueryParameters(query, orderByRelationMap, allowedOrderBy, whereProcessor);
        if (!processAttributes) {
            return givenParams;
        }
        const defaultParams = repository.getDefaultListParams();
        return _.defaults(givenParams, defaultParams);
    }
    /**
     *
     * @param {Object} query - parsed query string
     * @param {Object} orderByRelationMap
     * @param {string[]|null} allowedSortBy
     * @param {Function|null} whereProcessor
     * @returns {Object}
     */
    static getQueryParameters(query, orderByRelationMap = {}, allowedSortBy = null, whereProcessor = null) {
        const params = {};
        params.where = {};
        if (whereProcessor) {
            // @ts-ignore
            whereProcessor(query, params);
        }
        this.setOffsetLimit(query, params);
        this.setOrderBy(query, params, orderByRelationMap, allowedSortBy);
        return params;
    }
    static processWithIncludeProcessor(repository, query, params) {
        const includeProcessor = repository.getIncludeProcessor();
        includeProcessor(query, params);
    }
    static getMetadata(totalAmount, query, params) {
        return {
            total_amount: totalAmount,
            page: +query.page,
            per_page: +query.per_page,
            has_more: params.offset + params.limit < totalAmount,
        };
    }
    /**
     *
     * @param {Object} query
     * @param {Object} params
     * @private
     */
    static setOffsetLimit(query, params) {
        const page = +query.page;
        let perPage = +query.per_page;
        if (!page || page < 0) {
            return;
        }
        if (!perPage || perPage < 0) {
            return;
        }
        if (perPage > PER_PAGE_LIMIT) {
            perPage = PER_PAGE_LIMIT;
        }
        let offset = 0;
        if (page > 1) {
            offset = this.getOffsetByPagePerPage(page, perPage);
        }
        params.offset = offset;
        params.limit = perPage;
    }
    static getOffsetByPagePerPage(page, perPage) {
        return (page - 1) * perPage;
    }
    /**
     *
     * @param {Object} query - parsed query string
     * @param {Object} params
     * @param {Object} orderByRelationMap
     * @param {string[]} allowedSortBy
     * @returns {void}
     */
    static setOrderBy(query, params, orderByRelationMap, allowedSortBy = null) {
        if (!query.sort_by) {
            return;
        }
        const sorting = [];
        query.sort_by.split(',').forEach((value) => {
            let sortOrder = 'ASC';
            let valueToSort = value;
            if (value[0] === '-') {
                sortOrder = 'DESC';
                valueToSort = value.substring(1);
            }
            if (allowedSortBy !== null && !(~allowedSortBy.indexOf(valueToSort))) {
                const errorMsg = allowedSortBy.length > 0 ? `sort_by field ${valueToSort} is not supported. Supported fields are: ${allowedSortBy.join(', ')}`
                    : 'sort_by is not supported yet';
                throw new BadRequestError(errorMsg);
            }
            let toPush = [];
            if (orderByRelationMap[valueToSort]) {
                toPush = Array.prototype.concat(orderByRelationMap[valueToSort], sortOrder);
            }
            else {
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
module.exports = QueryFilterService;
