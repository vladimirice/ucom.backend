const EntityModelProvider = require('../service/entity-model-provider');
const model = EntityModelProvider.getSourcesModel();
const db = require('../../../models').sequelize;

const TABLE_NAME = EntityModelProvider.getSourcesTableName();

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

  /**
   *
   * @param {number} entity_id
   * @param {string} entity_name
   * @return {Promise<Object>}
   */
  static async findAllByEntity(entity_id, entity_name) {
    return await model.findAll({
      where: {
        entity_id,
        entity_name
      },
      raw: true,
    });
  }
}

module.exports = EntitySourcesRepository;