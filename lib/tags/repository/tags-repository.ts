import { Transaction } from 'knex';
import { DbTag, TagsModelResponse, TagWithEventParamsDto } from '../interfaces/dto-interfaces';
import { DbParamsDto, QueryFilteredRepository } from '../../api/filters/interfaces/query-filter-interfaces';
import { TagDbModel } from '../models/tags-model';
import { StringToNumberCollection } from '../../common/interfaces/common-types';

import TagsModelProvider = require('../service/tags-model-provider');
import QueryFilterService = require('../../api/filters/query-filter-service');
import RepositoryHelper = require('../../common/repository/repository-helper');
import EntityListCategoryDictionary = require('../../stats/dictionary/entity-list-category-dictionary');

const knex = require('../../../config/knex');

const TABLE_NAME = TagsModelProvider.getTableName();
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';

// @ts-ignore
class TagsRepository implements QueryFilteredRepository {
  public static getWhenThenString(title: string, value: number) {
    return ` WHEN title = '${title}' THEN ${value}`;
  }

  // #tech-debt - here will be problems if titlesNotToReset were too big
  public static async resetTagsCurrentStats(
    titlesNotToReset: string[],
  ): Promise<void> {
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

  public static async updateTagsCurrentStats(
    whenThenRateString: string,
    whenThenPostsString: string,
    whenThenMediaPostsString: string,
    whenThenDirectPostsString: string,
    titles: string[],
  ): Promise<any> {
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
  public static async createNewTags(tags: Object, trx: Transaction): Promise<StringToNumberCollection> {
    const data =
      await trx(this.getTableName()).returning(['id', 'title']).insert(tags);

    const res: StringToNumberCollection = {};

    data.forEach((item) => {
      res[item.title] = +item.id;
    });

    return res;
  }

  public static async findOneByTitle(tagTitle: string): Promise<DbTag|null> {
    const select = this.getTagPreviewFields();

    const data = await knex(this.getTableName())
      .select(select)
      .where('title', tagTitle)
      .first()
    ;

    if (!data) {
      return null;
    }

    RepositoryHelper.convertStringFieldsToNumbers(data, this.getNumericalFields());

    return data;
  }

  public static async findManyTagsIdsWithOrderAndLimit(
    orderByRaw: string,
    limit: number,
    page: number = 0,
  ): Promise<number[]> {
    const offset = page === 0 ? 0 : QueryFilterService.getOffsetByPagePerPage(page, limit);

    const data = await knex(this.getTableName())
      .select('id')
      .orderByRaw(orderByRaw)
      .limit(limit)
      .offset(offset)
    ;

    return data.map(item => +item.id);
  }

  public static async findAllTagsByTitles(titles: string[]): Promise<StringToNumberCollection> {
    const data = await knex(this.getTableName())
      .select(['id', 'title'])
      .whereIn('title', titles)
    ;

    const res: StringToNumberCollection = {};

    data.forEach((item) => {
      res[item.title] = +item.id;
    });

    return res;
  }

  public static async getAllTags(): Promise<DbTag[]> {
    return knex(this.getTableName()).select('*');
  }

  public static async findManyTagsEntityEvents(
    limit: number,
    lastId: number | null = null,
  ): Promise<TagWithEventParamsDto[]> {
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
      .limit(limit)
    ;

    if (lastId) {
      // noinspection JSIgnoredPromiseFromCall
      queryBuilder.whereRaw(`id > ${+lastId}`);
    }

    const data = await queryBuilder;

    return data.map(item => ({
      // #task - implement correct cycle of tag uniqid assigning
      blockchain_id:                NOT_DETERMINED_BLOCKCHAIN_ID,
      id:                           +item.id,
      current_rate:                 +item.current_rate,
      current_posts_amount:         +item.current_posts_amount,
      current_media_posts_amount:   +item.current_media_posts_amount,
      current_direct_posts_amount:  +item.current_direct_posts_amount,
      current_followers_amount:     +item.current_followers_amount,
    }));
  }

  public static async findManyTagsForList(
    params: DbParamsDto,
  ): Promise<TagsModelResponse[]> {
    const res = await TagDbModel.prototype.findAllTagsBy(params).fetchAll();

    return res.toJSON();
  }

  public static async countManyTagsForList(params: DbParamsDto): Promise<number> {
    const query = knex(TABLE_NAME).count(`${TABLE_NAME}.id AS amount`);

    TagDbModel.prototype.addCurrentParamsInnerJoin(query);

    if (params.whereRaw) {
      // noinspection JSIgnoredPromiseFromCall
      query.whereRaw(params.whereRaw);
    }

    const res = await query;

    return +res[0].amount;
  }

  public static getTagPreviewFields(): string[] {
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

  public static getNumericalFields(): string[] {
    return [
      'id',
      'current_posts_amount',
      'current_rate',
    ];
  }

  // noinspection JSUnusedGlobalSymbols
  public static getAllowedOrderBy(): string[] {
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
  public static getDefaultListParams(): DbParamsDto {
    return {
      attributes: this.getTagPreviewFields(),
      where: {},
      limit: 10,
      offset: 0,
      order: this.getDefaultOrderBy(),
    };
  }

  // noinspection JSUnusedGlobalSymbols
  public static getOrderByRelationMap() {
    return {};
  }

  // noinspection JSUnusedGlobalSymbols
  public static getWhereProcessor(): Function {
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

  public static whereRawTrending(): string {
    const tableName = TagsModelProvider.getCurrentParamsTableName();

    return `${tableName}.importance_delta > 0 AND ${tableName}.posts_total_amount_delta > 0`;
  }

  public static whereRawHot(): string {
    const tableName = TagsModelProvider.getCurrentParamsTableName();

    return `${tableName}.activity_index_delta > 0`;
  }

  private static getDefaultOrderBy(): string[][] {
    return [
      ['id', 'DESC'],
    ];
  }

  private static getTableName(): string {
    return TagsModelProvider.getTableName();
  }
}

export = TagsRepository;
