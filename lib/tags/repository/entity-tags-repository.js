"use strict";
const knex = require('../../../config/knex');
const TABLE_NAME = 'entity_tags';
class EntityTagsRepository {
    static async createNewEntityTags(toInsert, trx) {
        return trx(TABLE_NAME).insert(toInsert);
    }
    static async deleteEntityTagsByPrimaryKey(ids, trx) {
        return trx(TABLE_NAME).whereIn('id', ids).del();
    }
    static async findAllByEntity(entityId, entityName) {
        const where = {
            entity_id: entityId,
            entity_name: entityName,
        };
        const unprocessed = await knex(TABLE_NAME).select(['id', 'tag_title'])
            .where(where);
        const res = {};
        unprocessed.forEach((item) => {
            res[item.tag_title] = +item.id;
        });
        return res;
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     */
    static async findAllWithAllFieldsByEntity(entityId, entityName) {
        const where = {
            entity_id: entityId,
            entity_name: entityName,
        };
        return knex(TABLE_NAME)
            .where(where);
    }
}
module.exports = EntityTagsRepository;
