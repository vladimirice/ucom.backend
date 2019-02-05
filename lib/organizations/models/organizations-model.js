"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryFilterService = require("../../api/filters/query-filter-service");
const OrganizationsModelProvider = require("../service/organizations-model-provider");
const { bookshelf } = require('../../../config/knex');
const TABLE_NAME = OrganizationsModelProvider.getTableName();
// noinspection JSDeprecatedSymbols
const orgDbModel = bookshelf.Model.extend({
    tableName: TABLE_NAME,
    findAllOrgsBy(params) {
        return this.query((query) => {
            QueryFilterService.addParamsToKnexQuery(query, params);
        });
    },
});
exports.orgDbModel = orgDbModel;
