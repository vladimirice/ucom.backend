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
const TABLE_NAME = 'entity_tags';
class EntityTagsRepository {
    static createNewEntityTags(toInsert, trx) {
        return __awaiter(this, void 0, void 0, function* () {
            return trx(TABLE_NAME).insert(toInsert);
        });
    }
    static findAllByEntity(entityId, entityName) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                entity_id: entityId,
                entity_name: entityName,
            };
            const unprocessed = yield knex(TABLE_NAME).select(['id', 'tag_title'])
                .where(where);
            const res = {};
            unprocessed.forEach((item) => {
                res[item.tag_title] = +item.id;
            });
            return res;
        });
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     */
    static findAllWithAllFieldsByEntity(entityId, entityName) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                entity_id: entityId,
                entity_name: entityName,
            };
            return knex(TABLE_NAME)
                .where(where);
        });
    }
}
module.exports = EntityTagsRepository;
