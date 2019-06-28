const moment = require('moment');
const knex = require('../../../config/knex');

const TABLE_NAME = 'entity_stats_current';

const db = require('../../../models').sequelize;

const postsModelProvider = require('../../posts/service/posts-model-provider');

/**
 * @deprecated
 */
class EntityStatsCurrentRepository {
  static async updateUpvoteDelta() {
    const newData = moment().subtract(24 * 3, 'hours');
    const createdAtAsString = newData.utc().format('YYYY-MM-DD HH:mm:ss');

    const sql1 = `
      SELECT COUNT(1) as likesCount, entity_id_to FROM users_activity
--         INNER JOIN posts ON posts.id = entity_id_for AND posts.post_type_id = 1
      WHERE entity_name = 'posts     '
      AND activity_type_id = 2
      AND activity_group_id = 2
      AND created_at < '${createdAtAsString}'
      AND entity_id_to IN (
        SELECT id FROM posts WHERE post_type_id = 1
      )
      GROUP BY entity_id_to;
    `;

    const totalLikesOneDayAgoRaw = await db.query(sql1, { type: db.QueryTypes.SELECT });
    const sql2 = `
      SELECT COUNT(1) as likesCount, entity_id_to FROM users_activity
--         INNER JOIN posts ON posts.id = entity_id_for AND posts.post_type_id = 1
      WHERE entity_name = 'posts     '
      AND activity_type_id = 2
      AND activity_group_id = 2
      AND entity_id_to IN (
        SELECT id FROM posts WHERE post_type_id = 1
      )
      GROUP BY entity_id_to;
    `;

    const totalLikesNow = await db.query(sql2, { type: db.QueryTypes.SELECT });

    const likesStat = {};
    totalLikesNow.forEach((model) => {
      likesStat[model.entity_id_to] = {
        entity_id: +model.entity_id_to,
        entity_name: postsModelProvider.getEntityName(),
        current:  +model.likescount,
        upvote_delta:    +model.likescount, // if no before then delta wil be max
      };
    });

    totalLikesOneDayAgoRaw.forEach((model) => {
      const related = likesStat[model.entity_id_to];

      related.upvote_delta = +related.current - +model.likescount;
    });

    return this.upsertUpvoteDelta(likesStat);
  }

  /**
   *
   * @param {number[]} postsIds
   * @return {Promise<Object>}
   */
  static async getImportanceDeltaForPosts(postsIds) {
    const data = await knex.select(['entity_id', 'importance_delta'])
      .from(TABLE_NAME)
      .whereIn('entity_id', postsIds)
      .andWhere('entity_name', postsModelProvider.getEntityName())
    ;

    const res = {};
    data.forEach((item) => {
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
    const values: any = [];
    for (const accountName in toProcess) {
      if (!toProcess.hasOwnProperty(accountName)) {
        continue;
      }

      const current = toProcess[accountName];

      if (current.malformed) {
        continue;
      }

      values.push(this.convertObjectToValues(current, 'importance_delta'));
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

    await db.query(sql);
    // WARNING! Mind about concurrency issues in future
    await db.query(`SELECT setval('${TABLE_NAME}_id_seq', MAX(id), true) FROM ${TABLE_NAME}`);
  }

  /**
   *
   * @param {Object[]} toProcess
   * @return {Promise<void>}
   */
  static async upsertUpvoteDelta(toProcess) {
    const values: any = [];
    for (const accountName in toProcess) {
      const current = toProcess[accountName];

      values.push(this.convertObjectToValues(current, 'upvote_delta'));
    }

    if (values.length === 0) {
      throw new Error('No data to process');
    }

    const valuesString = values.join(', ');

    const sql = `
    INSERT INTO ${TABLE_NAME}
      ("entity_id", "entity_name", "upvote_delta", "updated_at")
    VALUES ${valuesString}
    ON CONFLICT (entity_id, entity_name) DO
    UPDATE
        SET upvote_delta      = EXCLUDED.upvote_delta,
            updated_at        = EXCLUDED.updated_at
    ;
    `;

    await db.query(sql);
    // WARNING! Mind about concurrency issues in future
    await db.query(`SELECT setval('${TABLE_NAME}_id_seq', MAX(id), true) FROM ${TABLE_NAME}`);
  }

  /**
   *
   * @param {Object} data
   * @param {string} statsField
   * @return {string}
   * @private
   */
  private static convertObjectToValues(data, statsField) {
    const values: any = [];

    const updatedAt = moment().utc().format('YYYY-MM-DD HH:mm:ss');

    values.push(+data.entity_id);
    values.push(`'${data.entity_name}'`);
    values.push(`${data[statsField]}`);
    values.push(`'${updatedAt}'`);

    return `(${values.join(', ')})`;
  }
}

export = EntityStatsCurrentRepository;
