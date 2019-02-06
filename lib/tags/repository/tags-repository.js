"use strict";
const tags_model_1 = require("../models/tags-model");
const TagsModelProvider = require("../service/tags-model-provider");
const knex = require('../../../config/knex');
// @ts-ignore
class TagsRepository {
    static getWhenThenString(title, currentRate) {
        return ` WHEN title = '${title}' THEN ${currentRate}`;
    }
    static async updateTagsCurrentRates(whenThenString, titles) {
        const processedTitles = titles.map(item => `'${item}'`);
        const sql = `
      UPDATE tags
        SET current_rate =
          CASE
            ${whenThenString}
            -- NO ELSE BECAUSE THERE IS NO DEFAULT VALUE
          END
        WHERE title IN (${processedTitles.join(', ')})
    `;
        return knex.raw(sql);
    }
    /**
     *
     * @param {Object} tags
     * @param {Transaction} trx
     */
    static async createNewTags(tags, trx) {
        const data = await trx(this.getTableName()).returning(['id', 'title']).insert(tags);
        const res = {};
        data.forEach((item) => {
            res[item.title] = +item.id;
        });
        return res;
    }
    static async findOneByTitle(tagTitle) {
        const data = await knex(this.getTableName())
            .select(['id', 'title', 'current_rate', 'created_at'])
            .where('title', tagTitle)
            .first();
        if (!data) {
            return null;
        }
        data.id = +data.id;
        data.current_rate = +data.current_rate;
        return data;
    }
    static async findManyTagsIdsWithOrderAndLimit(orderByRaw, limit) {
        const data = await knex(this.getTableName())
            .select('id')
            .orderByRaw(orderByRaw)
            .limit(limit);
        return data.map(item => +item.id);
    }
    /**
     *
     * @param {string[]} titles
     */
    static async findAllTagsByTitles(titles) {
        const data = await knex(this.getTableName())
            .select(['id', 'title'])
            .whereIn('title', titles);
        const res = {};
        data.forEach((item) => {
            res[item.title] = +item.id;
        });
        return res;
    }
    // noinspection JSUnusedGlobalSymbols
    static async getAllTags() {
        return knex(this.getTableName()).select('*');
    }
    static async findManyTagsForList(params) {
        const res = await tags_model_1.TagDbModel.prototype.findAllTagsBy(params).fetchAll();
        return res.toJSON();
    }
    static async countManyTagsForList() {
        const res = await knex(TagsModelProvider.getTableName()).count('id AS amount');
        return +res[0].amount;
    }
    static getTagPreviewFields() {
        return [
            'id',
            'title',
            'current_rate',
            'created_at',
            'updated_at',
        ];
    }
    /**
     * @return string
     * @private
     */
    static getTableName() {
        return 'tags';
    }
    // noinspection JSUnusedGlobalSymbols
    static getAllowedOrderBy() {
        return [
            'id',
            'title',
            'current_rate',
            'created_at',
        ];
    }
    // noinspection JSUnusedGlobalSymbols
    static getDefaultListParams() {
        return {
            attributes: this.getTagPreviewFields(),
            where: {},
            limit: 10,
            offset: 0,
            order: this.getDefaultOrderBy(),
        };
    }
    // noinspection JSUnusedGlobalSymbols
    static getOrderByRelationMap() {
        return {};
    }
    // noinspection JSUnusedGlobalSymbols
    static getWhereProcessor() {
        // @ts-ignore
        return (query, params) => {
            params.where = {};
        };
    }
    static getDefaultOrderBy() {
        return [
            ['id', 'DESC'],
        ];
    }
}
module.exports = TagsRepository;
