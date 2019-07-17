"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryFilterService = require("../../api/filters/query-filter-service");
const TagsModelProvider = require("../service/tags-model-provider");
const bookshelfLib = require('bookshelf');
const knex = require('../../../config/knex');
const bookshelf = bookshelfLib(knex);
const TABLE_NAME = TagsModelProvider.getTableName();
const CURRENT_PARAMS_TABLE_NAME = TagsModelProvider.getCurrentParamsTableName();
// noinspection JSDeprecatedSymbols
const TagDbModel = bookshelf.Model.extend({
    tableName: TABLE_NAME,
    findAllTagsBy(requestQuery, params) {
        return this.query((queryBuilder) => {
            QueryFilterService.processAttributes(params, TABLE_NAME);
            QueryFilterService.addParamsToKnexQuery(queryBuilder, params);
            this.addSearchWhere(queryBuilder, requestQuery);
            this.addCurrentParamsInnerJoin(queryBuilder);
        });
    },
    addSearchWhere(queryBuilder, requestQuery) {
        const searchPattern = requestQuery.tags_identity_pattern;
        if (!searchPattern) {
            return;
        }
        queryBuilder.where('title', 'ilike', `%${searchPattern}%`);
    },
    addCurrentParamsInnerJoin(query) {
        // noinspection JSIgnoredPromiseFromCall // #task - use inner join instead
        query.join(CURRENT_PARAMS_TABLE_NAME, `${TABLE_NAME}.id`, '=', `${CURRENT_PARAMS_TABLE_NAME}.tag_id`);
    },
});
exports.TagDbModel = TagDbModel;
