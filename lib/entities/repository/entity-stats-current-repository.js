// TODO - move to config

const knex = require('../../../config/knex');

const TABLE_NAME = 'entity_stats_current';

const moment = require('moment');

const db = require('../../../models').sequelize;

const PostsModelProvider = require('../../posts/service/posts-model-provider');

class EntityStatsCurrentRepository {

  /**
   *
   * @param {number[]} postsIds
   * @return {Promise<Object>}
   */
  static async getImportanceDeltaForPosts(postsIds) {
    const data = await knex.select(['entity_id', 'importance_delta'])
      .from(TABLE_NAME)
      .whereIn('entity_id', postsIds)
      .andWhere('entity_name', PostsModelProvider.getEntityName())
    ;

    const res = {};
    data.forEach(item => {
      res[item.entity_id] = +item.importance_delta;
    });

    return res;
  }

  /**
   *
   * @param {Object[]} toProcess
   * @return {Promise<void>}
   */
  static async upsertImportanceDelta(toProcess) {
    const values = [];
    for (const accountName in toProcess) {
      const current = toProcess[accountName];

      if (current.malformed) {
        continue;
      }

      values.push(this._convertObjectToValues(current));
    }

    if (values.length === 0) {
      throw new Error('All data to process is marked as malformed');
    }

    const valuesString = values.join(', ');

    // extract values from toProcess and update them
    const sql = `
    INSERT INTO ${TABLE_NAME} 
      ("entity_id", "entity_name", "importance_delta", "updated_at")
    VALUES ${valuesString}
    ON CONFLICT (entity_id, entity_name) DO
    UPDATE
        SET importance_delta  = EXCLUDED.importance_delta,
            updated_at        = EXCLUDED.updated_at
    ;
    `;

    return db.query(sql);
  }

  /**
   *
   * @param {Object} data
   * @return {string}
   * @private
   */
  static _convertObjectToValues(data) {
    const values = [];

    const updatedAt = moment().utc().format('YYYY-MM-DD HH:mm:ss');

    values.push(data.entity_id);
    values.push(`'${data.entity_name}'`);
    values.push(`${data.importance_delta}`);
    values.push(`'${updatedAt}'`);

    return `(${values.join(', ')})`;
  }
}

module.exports = EntityStatsCurrentRepository;