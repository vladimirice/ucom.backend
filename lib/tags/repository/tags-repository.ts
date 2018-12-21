import { Transaction } from 'knex';

const knex = require('../../../config/knex');

class TagsRepository {
  /**
   *
   * @param {Object[]} tags
   * @param {Transaction} trx
   */
  static async createNewTags(tags: Object[], trx: Transaction) {
    return knex(this.getTableName()).transacting(trx).returning(['id', 'title']).insert(tags);
  }

  static async getAllTags() {
    return knex(this.getTableName()).select('*');
  }

  /**
   * @return string
   */
  static getTableName() {
    return 'tags';
  }
}

export = TagsRepository;
