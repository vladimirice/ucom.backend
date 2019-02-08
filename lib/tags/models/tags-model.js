"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryFilterService = require("../../api/filters/query-filter-service");
const TagsModelProvider = require("../service/tags-model-provider");
const bookshelfLib = require('bookshelf');
const knex = require('../../../config/knex');
const bookshelf = bookshelfLib(knex);
// noinspection JSDeprecatedSymbols
const TagDbModel = bookshelf.Model.extend({
    tableName: TagsModelProvider.getTableName(),
    findAllTagsBy(params) {
        return this.query((query) => {
            QueryFilterService.addParamsToKnexQuery(query, params);
        });
    },
});
exports.TagDbModel = TagDbModel;
