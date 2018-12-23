import { Transaction } from 'knex';

const knex = require('../../../config/knex');

class TagsRepository {
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

  /**
   * @param {string} tagTitle
   */
  static async findOneByTitle(tagTitle: string): Promise<Object|null> {
    const data = await knex(this.getTableName())
      .select(['id', 'title', 'created_at'])
      .where('title', tagTitle)
      .first()
    ;

    if (!data) {
      return null;
    }

    data.id = +data.id;

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
