const EntityModelProvider = require('../service/entity-model-provider');
const model = EntityModelProvider.getSourcesModel();

class EntitySourcesRepository {
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