"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryFilterService = require("../../api/filters/query-filter-service");
const OrganizationsModelProvider = require("../service/organizations-model-provider");
const UsersModelProvider = require("../../users/users-model-provider");
const bookshelfLib = require('bookshelf');
const knex = require('../../../config/knex');
const bookshelf = bookshelfLib(knex);
const TABLE_NAME = OrganizationsModelProvider.getTableName();
const CURRENT_PARAMS_TABLE_NAME = OrganizationsModelProvider.getCurrentParamsTableName();
const usersActivityFollowTableName = UsersModelProvider.getUsersActivityFollowTableName();
// noinspection JSDeprecatedSymbols
const orgDbModel = bookshelf.Model.extend({
    tableName: TABLE_NAME,
    findAllOrgsBy(requestQuery, params) {
        return this.query((queryBuilder) => {
            QueryFilterService.processAttributes(params, TABLE_NAME);
            QueryFilterService.addParamsToKnexQuery(queryBuilder, params);
            this.addSearchWhere(queryBuilder, requestQuery);
            queryBuilder.select(knex.raw('coalesce(f.number, 0) AS number_of_followers'));
            this.addCurrentParamsLeftJoin(queryBuilder);
            this.addUsersActivityLeftJoin(queryBuilder, params);
        });
    },
    addSearchWhere(queryBuilder, requestQuery) {
        const searchPattern = requestQuery.organizations_identity_pattern;
        if (!searchPattern) {
            return;
        }
        queryBuilder.andWhere(function () {
            this.where('title', 'ilike', `%${searchPattern}%`)
                .orWhere('nickname', 'ilike', `%${searchPattern}%`);
        });
    },
    addUsersActivityLeftJoin(query) {
        query.leftJoin(knex(usersActivityFollowTableName)
            .select([knex.raw('COUNT(id) AS number'), 'entity_id'])
            .where('entity_name', OrganizationsModelProvider.getEntityName())
            .groupBy('entity_id')
            .as('f'), `${TABLE_NAME}.id`, 'f.entity_id');
    },
    addCurrentParamsLeftJoin(query) {
        // noinspection JSIgnoredPromiseFromCall // #task - use inner join instead
        query.leftJoin(CURRENT_PARAMS_TABLE_NAME, `${TABLE_NAME}.id`, '=', `${CURRENT_PARAMS_TABLE_NAME}.organization_id`);
    },
});
exports.orgDbModel = orgDbModel;
