"use strict";
const knex = require('../../../config/knex');
const TABLE_NAME = 'entity_state_log';
class EntityStateLogRepository {
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     */
    static async findLastEntityStateLog(entityId, entityName) {
        const where = {
            entity_id: entityId,
            entity_name: entityName,
        };
        return knex(TABLE_NAME).where(where).orderBy('id', 'DESC').limit(1)
            .first();
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     * @param {Object} stateObject
     * @param {Transaction} trx
     */
    static async insertNewState(entityId, entityName, stateObject, trx) {
        return trx(TABLE_NAME).transacting(trx).insert({
            entity_id: entityId,
            entity_name: entityName,
            state_json: JSON.stringify(stateObject),
        });
    }
}
module.exports = EntityStateLogRepository;
