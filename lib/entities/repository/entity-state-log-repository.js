"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const knex = require('../../../config/knex');
const TABLE_NAME = 'entity_state_log';
class EntityStateLogRepository {
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     */
    static findLastEntityStateLog(entityId, entityName) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                entity_id: entityId,
                entity_name: entityName,
            };
            return knex(TABLE_NAME).where(where).orderBy('id', 'DESC').limit(1).first();
        });
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     * @param {Object} stateObject
     * @param {Transaction} trx
     */
    static insertNewState(entityId, entityName, stateObject, trx) {
        return __awaiter(this, void 0, void 0, function* () {
            return knex(TABLE_NAME).transacting(trx).insert({
                entity_id: entityId,
                entity_name: entityName,
                state_json: JSON.stringify(stateObject),
            });
        });
    }
}
module.exports = EntityStateLogRepository;
