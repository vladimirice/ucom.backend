"use strict";
const knex = require('../../../config/knex');
const queryFilterService = require('../../api/filters/query-filter-service');
class TaggableRepository {
    static findAllByTagTitle(tableName, tagTitle, tagsJoinColumn, params, extraFieldsToSelect = null) {
        let toSelect = [];
        params.attributes.forEach((field) => {
            toSelect.push(`${params.main_table_alias}.${field}`);
        });
        if (extraFieldsToSelect !== null) {
            toSelect = [
                ...toSelect,
                ...extraFieldsToSelect,
            ];
        }
        const knexOrderByRaw = queryFilterService.sequelizeOrderByToKnexRaw(params.order, params.main_table_alias);
        return knex(`${tableName} AS ${params.main_table_alias}`)
            .select(toSelect)
            .where('entity_tags.tag_title', tagTitle)
            .innerJoin('entity_tags', `${params.main_table_alias}.id`, `entity_tags.${tagsJoinColumn}`)
            .groupBy(toSelect)
            .orderByRaw(knexOrderByRaw)
            .offset(params.offset)
            .limit(params.limit);
    }
    /**
     *
     * @param {string} mainTableName
     * @param {string} tagTitle
     * @param {string} tagsJoinColumn
     * @returns {Knex.QueryBuilder}
     */
    static async countAllByTagTitle(mainTableName, tagTitle, tagsJoinColumn) {
        const data = await knex(mainTableName)
            .countDistinct(`${mainTableName}.id`)
            .where('entity_tags.tag_title', tagTitle)
            .innerJoin('entity_tags', `${mainTableName}.id`, `entity_tags.${tagsJoinColumn}`)
            .first();
        return +data.count;
    }
}
module.exports = TaggableRepository;
