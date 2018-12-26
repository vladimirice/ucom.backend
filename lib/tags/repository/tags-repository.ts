import { Transaction } from 'knex';
import { StringToNumObj, DbTag } from '../interfaces/dto-interfaces';

const knex = require('../../../config/knex');

class TagsRepository {

  static async updateTagsCurrentRates(tagsToRate: StringToNumObj) {
    let whenThenString: string = ' ';
    for (const title in tagsToRate) {
      const value: number = tagsToRate[title];

      whenThenString += `WHEN title = '${title}' THEN ${value}`;
    }

    const sql = `
      UPDATE tags
        SET current_rate =
          CASE
            ${whenThenString}
          ELSE 0 -- If there are no titles with rate then there are no posts with such tags
          END
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

  /**
   * @return string
   * @private
   */
  private static getTableName(): string {
    return 'tags';
  }
}

export = TagsRepository;
