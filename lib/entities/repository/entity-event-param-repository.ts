const knex = require('../../../config/knex');

const TABLE_NAME = 'entity_event_param';

class EntityEventParamRepository {
  /**
   *
   * @param {string} where
   * @return {Promise<Object[]>}
   */
  static async findLastRowsGroupedByEntity(where) {
    return await knex(TABLE_NAME).distinct(knex.raw(
      'ON (entity_blockchain_id, event_type) entity_blockchain_id, json_value, entity_name',
    ))
      .whereRaw(where)
      .orderBy('entity_blockchain_id')
      .orderBy('event_type')
      .orderBy('id', 'DESC')
      ;
  }
}

export = EntityEventParamRepository;
