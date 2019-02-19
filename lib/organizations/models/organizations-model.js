"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryFilterService = require("../../api/filters/query-filter-service");
const OrganizationsModelProvider = require("../service/organizations-model-provider");
const bookshelfLib = require('bookshelf');
const knex = require('../../../config/knex');
const bookshelf = bookshelfLib(knex);
const TABLE_NAME = OrganizationsModelProvider.getTableName();
const CURRENT_PARAMS_TABLE_NAME = OrganizationsModelProvider.getCurrentParamsTableName();
// noinspection JSDeprecatedSymbols
const orgDbModel = bookshelf.Model.extend({
    tableName: TABLE_NAME,
    findAllOrgsBy(params) {
        return this.query((query) => {
            QueryFilterService.processAttributes(params, TABLE_NAME);
            QueryFilterService.addParamsToKnexQuery(query, params);
            query.join(CURRENT_PARAMS_TABLE_NAME, `${TABLE_NAME}.id`, '=', `${CURRENT_PARAMS_TABLE_NAME}.organization_id`);
        });
    },
});
exports.orgDbModel = orgDbModel;
