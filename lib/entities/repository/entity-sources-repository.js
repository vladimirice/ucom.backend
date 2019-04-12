"use strict";
const entityModelProvider = require('../service/entity-model-provider');
const model = entityModelProvider.getSourcesModel();
const db = require('../../../models').sequelize;
const TABLE_NAME = entityModelProvider.getSourcesTableName();
class EntitySourcesRepository {
    /**
     *
     * @param {Object[]}entities
     * @return {Promise<Object>}
     */
    static async bulkCreate(entities) {
        return await model.bulkCreate(entities);
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     * @return {Promise<Object>}
     */
    static async findAllEntityRelatedSources(entityId, entityName) {
        const sql = `
      SELECT * FROM ${TABLE_NAME}
        WHERE entity_id = ${+entityId} AND entity_name = '${entityName}'
    `;
        const result = await db.query(sql);
        return result[0];
    }
    static async findAllByEntity(entityId, entityName) {
        return model.findAll({
            where: {
                entity_id: entityId,
                entity_name: entityName,
            },
            raw: true,
        });
    }
    static async findAllRelatedToEntityWithGroupId(entityId, entityName, sourceGroupId) {
        const where = {
            entity_name: entityName,
            entity_id: entityId,
            source_group_id: sourceGroupId,
        };
        const res = await entityModelProvider.getSourcesModel().findAll({
            where,
            raw: true,
        });
        if (!res) {
            return res;
        }
        res.forEach((data) => {
            data.id = +data.id;
        });
        return res;
    }
}
module.exports = EntitySourcesRepository;
