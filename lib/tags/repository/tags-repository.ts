import { Transaction } from 'knex';
import { DbTag, TagsModelResponse } from '../interfaces/dto-interfaces';
import { DbParamsDto, QueryFilteredRepository } from '../../api/filters/interfaces/query-filter-interfaces';
import { TagDbModel } from '../models/tags-model';

import TagsModelProvider = require('../service/tags-model-provider');

const knex = require('../../../config/knex');

// @ts-ignore
class TagsRepository implements QueryFilteredRepository {
  static getWhenThenString(title: string, currentRate: number) {
    return ` WHEN title = '${title}' THEN ${currentRate}`;
  }

  static async updateTagsCurrentRates(whenThenString: string, titles: string[]): Promise<object> {
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
  static async createNewTags(tags: Object, trx: Transaction) {
    const data =
      await trx(this.getTableName()).returning(['id', 'title']).insert(tags);

    const res: Object = {};

    data.forEach((item) => {
      res[item.title] = +item.id;
    });

    return res;
  }

  static async findOneByTitle(tagTitle: string): Promise<DbTag|null> {
    const data = await knex(this.getTableName())
      .select(['id', 'title', 'current_rate', 'created_at'])
      .where('title', tagTitle)
      .first()
    ;

    if (!data) {
      return null;
    }

    data.id = +data.id;
    data.current_rate = +data.current_rate;

    return data;
  }

  public static async findManyTagsIdsWithOrderAndLimit(
    orderByRaw: string,
    limit: number,
  ): Promise<number[]> {
    const data = await knex(this.getTableName())
      .select('id')
      .orderByRaw(orderByRaw)
      .limit(limit)
    ;

    return data.map(item => +item.id);
  }

  /**
   *
   * @param {string[]} titles
   */
  static async findAllTagsByTitles(titles: string[]): Promise<Object> {
    const data = await knex(this.getTableName())
      .select(['id', 'title'])
      .whereIn('title', titles)
    ;

    const res: Object = {};

    data.forEach((item) => {
      res[item.title] = +item.id;
    });

    return res;
  }

  // noinspection JSUnusedGlobalSymbols
  static async getAllTags() {
    return knex(this.getTableName()).select('*');
  }

  public static async findManyTagsForList(
    params: DbParamsDto,
  ): Promise<TagsModelResponse[]> {
    const res = await TagDbModel.prototype.findAllTagsBy(params).fetchAll();

    return res.toJSON();
  }

  public static async countManyTagsForList(): Promise<number> {
    const res = await knex(TagsModelProvider.getTableName()).count('id AS amount');

    return +res[0].amount;
  }

  public static getTagPreviewFields(): string[] {
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
  private static getTableName(): string {
    return 'tags';
  }

  // noinspection JSUnusedGlobalSymbols
  public static getAllowedOrderBy(): string[] {
    return [
      'id',
      'title',
      'current_rate',
      'created_at',
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
    // @ts-ignore
    return (query, params) => {
      params.where = {};
    };
  }

  private static getDefaultOrderBy(): string[][] {
    return [
      ['id', 'DESC'],
    ];
  }
}

export = TagsRepository;
