"use strict";
const errors_1 = require("../errors");
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
    // This is a legacy. Consider to move to getQueryBuilderFilteredByRequestQuery filtering
    static addWhereRawParamToKnexQuery(queryBuilder, params) {
        if (params.whereRaw) {
            queryBuilder.whereRaw(params.whereRaw);
        }
    }
    static addParamsToKnexQuery(queryBuilder, params) {
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
            .offset(params.offset || 0);
    }
    static addQueryParamsToKnex(query, repository, knex) {
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
    static getQueryParametersWithRepository(query, repository, processAttributes = false, // hardcoded variable in order to reduce refactoring at the beginning
    processInclude = false, // hardcoded variable in order to reduce refactoring at the beginning
    processOrderByRaw = false, forKnexOnly = false) {
        const orderByRelationMap = repository.getOrderByRelationMap();
        const allowedOrderBy = repository.getAllowedOrderBy();
        const whereProcessor = repository.getWhereProcessor();
        const givenParams = this.getQueryParameters(query, orderByRelationMap, allowedOrderBy, whereProcessor);
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
    static addExtraAttributes(params, extraAttributes, prefix = '') {
        if (!params.attributes) {
            throw new errors_1.AppError('In order to add extra attributes add main attributes beforehand');
        }
        for (const attribute of extraAttributes) {
            const value = prefix !== '' ? `${prefix}.${attribute} AS ${attribute}` : attribute;
            params.attributes.push(value);
        }
    }
    static processAttributes(params, mainTableName, prefixAll = false) {
        if (!params.attributes) {
            return;
        }
        params.attributes = this.getPrefixedAttributes(params.attributes, mainTableName, prefixAll);
    }
    static getPrefixedAttributes(attributes, prefix, prefixAll = false, prefixForAlias = '') {
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
        return this.getMetadataByOffsetLimit(totalAmount, +query.page, +query.per_page, params.offset, params.limit);
    }
    static getMetadataByOffsetLimit(totalAmount, page, perPage, offset, limit) {
        return {
            page,
            total_amount: totalAmount,
            per_page: perPage,
            has_more: offset + limit < totalAmount,
        };
    }
    static getOffsetLimit(query) {
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
    static setOffsetLimit(query, params) {
        const { offset, limit } = this.getOffsetLimit(query);
        params.offset = offset;
        params.limit = limit;
    }
    static getOffsetByPagePerPage(page, perPage) {
        return (page - 1) * perPage;
    }
    static getSequelizeOrderBy(query, orderByRelationMap, allowedSortBy = null) {
        // backward compatibility
        const indexKey = query.sort_by ? 'sort_by' : 'order_by';
        if (!query[indexKey]) {
            return null;
        }
        const sorting = [];
        query[indexKey].split(',').forEach((value) => {
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
    static setOrderBy(query, params, orderByRelationMap, allowedSortBy = null) {
        const orderBy = this.getSequelizeOrderBy(query, orderByRelationMap, allowedSortBy);
        if (orderBy !== null) {
            params.order = this.getSequelizeOrderBy(query, orderByRelationMap, allowedSortBy);
        }
    }
}
module.exports = QueryFilterService;
