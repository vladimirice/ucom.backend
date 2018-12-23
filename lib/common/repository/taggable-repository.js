"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const knex = require('../../../config/knex');
const queryFilterService = require('../../api/filters/query-filter-service');
class TaggableRepository {
    /**
     *
     * @param {string} tableName
     * @param {string} tagTitle
     * @param {string} tagsJoinColumn
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    static findAllByTagTitle(tableName, tagTitle, tagsJoinColumn, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const toSelect = [];
            params.attributes.forEach((field) => {
                toSelect.push(`${params.main_table_alias}.${field}`);
            });
            const knexOrderByRaw = queryFilterService.sequelizeOrderByToKnexRaw(params.order, params.main_table_alias);
            return knex(`${tableName} AS ${params.main_table_alias}`)
                .select(toSelect)
                .where('entity_tags.tag_title', tagTitle)
                .innerJoin('entity_tags', `${params.main_table_alias}.id`, `entity_tags.${tagsJoinColumn}`)
                .groupBy(toSelect)
                .orderByRaw(knexOrderByRaw)
                .offset(params.offset)
                .limit(params.limit);
        });
    }
    /**
     *
     * @param {string} mainTableName
     * @param {string} tagTitle
     * @param {string} tagsJoinColumn
     * @returns {Knex.QueryBuilder}
     */
    static countAllByTagTitle(mainTableName, tagTitle, tagsJoinColumn) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield knex(mainTableName)
                .countDistinct(`${mainTableName}.id`)
                .where('entity_tags.tag_title', tagTitle)
                .innerJoin('entity_tags', `${mainTableName}.id`, `entity_tags.${tagsJoinColumn}`)
                .first();
            return +data.count;
        });
    }
}
module.exports = TaggableRepository;
