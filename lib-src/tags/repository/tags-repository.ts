const db = require('../../../config/knex');

class TagsRepository {
  /**
   *
   * @param {Object[]} tags
   */
  static async createNewTags(tags: Object[]) {
    return db(this.getTableName()).returning(['id', 'title']).insert(tags);
  }

  /**
   * @return string
   */
  static getTableName() {
    return 'tags';
  }
}

module.exports = TagsRepository;