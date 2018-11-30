const TABLE_NAME = 'blockchain_tr_traces';

const knex = require('../../../config/knex');

class BlockchainTrTracesRepository {
  /**
   *
   * @param {Object} models
   * @returns {Promise<*>}
   */
  static async insertManyTrTraces(models) {
    await knex(TABLE_NAME).insert(models);

    // TODO - fix this issue about sequence increment
  }

  static async setSeqCurrentValByMaxNum() {
    await knex.raw(`SELECT setval('${TABLE_NAME}_id_seq', (SELECT MAX(id) from "${TABLE_NAME}"));`);
  }

  /**
   * @param {number} trType
   * @returns {Promise<string|null>}
   */
  static async findLastExternalIdByTrType(trType) {
    const res = await knex.select('external_id')
      .from(TABLE_NAME)
      .where({tr_type: trType})
      .orderBy('id', 'DESC')
      .limit(1)
      .first()
    ;

    return res ? res.external_id : null;
  }
}

module.exports = BlockchainTrTracesRepository;