"use strict";
const tags_model_1 = require("../models/tags-model");
const TagsModelProvider = require("../service/tags-model-provider");
const QueryFilterService = require("../../api/filters/query-filter-service");
const RepositoryHelper = require("../../common/repository/repository-helper");
const EntityListCategoryDictionary = require("../../stats/dictionary/entity-list-category-dictionary");
const knex = require('../../../config/knex');
const TABLE_NAME = TagsModelProvider.getTableName();
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';
// @ts-ignore
class TagsRepository {
    static getWhenThenString(title, value) {
        return ` WHEN title = '${title}' THEN ${value}`;
    }
    // #tech-debt - here will be problems if titlesNotToReset were too big
    static async resetTagsCurrentStats(titlesNotToReset) {
        let where = '';
        const processedTitles = titlesNotToReset.map(item => `'${item}'`);
        if (processedTitles.length > 0) {
            where = ` WHERE title NOT IN (${processedTitles.join(', ')})`;
        }
        const sql = `
        -- noinspection SqlWithoutWhere
        UPDATE tags
        SET 
          current_rate = 0,
          current_posts_amount = 0,
          current_media_posts_amount = 0,
          current_direct_posts_amount = 0  
        ${where}
    `;
        await knex.raw(sql);
    }
    static async updateTagsCurrentStats(whenThenRateString, whenThenPostsString, whenThenMediaPostsString, whenThenDirectPostsString, titles) {
        const processedTitles = titles.map(item => `'${item}'`);
        const sql = `
      UPDATE tags
        SET current_rate =
          CASE
            ${whenThenRateString}
            -- NO ELSE BECAUSE THERE IS NO DEFAULT VALUE
          END,
          current_posts_amount = 
          CASE
            ${whenThenPostsString}
            -- NO ELSE BECAUSE THERE IS NO DEFAULT VALUE
          END,
          current_media_posts_amount = 
          CASE
            ${whenThenMediaPostsString}
            -- NO ELSE BECAUSE THERE IS NO DEFAULT VALUE
          END,
          current_direct_posts_amount =
          CASE
            ${whenThenDirectPostsString}
            -- NO ELSE BECAUSE THERE IS NO DEFAULT VALUE
          END
        WHERE title IN (${processedTitles.join(', ')})
    `;
        await knex.raw(sql);
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
        const select = this.getTagPreviewFields();
        const data = await knex(this.getTableName())
            .select(select)
            .where('title', tagTitle)
            .first();
        if (!data) {
            return null;
        }
        RepositoryHelper.convertStringFieldsToNumbers(data, this.getNumericalFields());
        return data;
    }
    static async findManyTagsIdsWithOrderAndLimit(orderByRaw, limit, page = 0) {
        const offset = page === 0 ? 0 : QueryFilterService.getOffsetByPagePerPage(page, limit);
        const data = await knex(this.getTableName())
            .select('id')
            .orderByRaw(orderByRaw)
            .limit(limit)
            .offset(offset);
        return data.map(item => +item.id);
    }
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
    static async getAllTags() {
        return knex(this.getTableName()).select('*');
    }
    static async findManyTagsEntityEvents(limit, lastId = null) {
        const queryBuilder = knex(TABLE_NAME)
            .select([
            'id',
            'current_rate',
            'current_posts_amount',
            'current_media_posts_amount',
            'current_direct_posts_amount',
            'current_followers_amount',
        ])
            .orderBy('id', 'ASC')
            .limit(limit);
        if (lastId) {
            // noinspection JSIgnoredPromiseFromCall
            queryBuilder.whereRaw(`id > ${+lastId}`);
        }
        const data = await queryBuilder;
        return data.map(item => ({
            // #task - implement correct cycle of tag uniqid assigning
            blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
            id: +item.id,
            current_rate: +item.current_rate,
            current_posts_amount: +item.current_posts_amount,
            current_media_posts_amount: +item.current_media_posts_amount,
            current_direct_posts_amount: +item.current_direct_posts_amount,
            current_followers_amount: +item.current_followers_amount,
        }));
    }
    static async findManyTagsForList(params) {
        const res = await tags_model_1.TagDbModel.prototype.findAllTagsBy(params).fetchAll();
        return res.toJSON();
    }
    static async countManyTagsForList(params) {
        const query = knex(TABLE_NAME).count(`${TABLE_NAME}.id AS amount`);
        tags_model_1.TagDbModel.prototype.addCurrentParamsInnerJoin(query);
        if (params.whereRaw) {
            // noinspection JSIgnoredPromiseFromCall
            query.whereRaw(params.whereRaw);
        }
        const res = await query;
        return +res[0].amount;
    }
    static getTagPreviewFields() {
        return [
            'id',
            'title',
            'current_rate',
            'current_posts_amount',
            'current_media_posts_amount',
            'current_direct_posts_amount',
            'created_at',
            'updated_at',
            'first_entity_id',
        ];
    }
    static getNumericalFields() {
        return [
            'id',
            'current_posts_amount',
            'current_rate',
        ];
    }
    // noinspection JSUnusedGlobalSymbols
    static getAllowedOrderBy() {
        return [
            'id',
            'title',
            'current_rate',
            'created_at',
            'importance_delta',
            'activity_index_delta',
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
        return (query, params) => {
            params.where = {};
            if (query.overview_type && query.overview_type === EntityListCategoryDictionary.getTrending()) {
                params.whereRaw = this.whereRawTrending();
            }
            if (query.overview_type && query.overview_type === EntityListCategoryDictionary.getHot()) {
                params.whereRaw = this.whereRawHot();
            }
        };
    }
    static whereRawTrending() {
        const tableName = TagsModelProvider.getCurrentParamsTableName();
        return `${tableName}.importance_delta > 0 AND ${tableName}.posts_total_amount_delta > 0`;
    }
    static whereRawHot() {
        const tableName = TagsModelProvider.getCurrentParamsTableName();
        return `${tableName}.activity_index_delta > 0`;
    }
    static getDefaultOrderBy() {
        return [
            ['id', 'DESC'],
        ];
    }
    static getTableName() {
        return TagsModelProvider.getTableName();
    }
}
module.exports = TagsRepository;
