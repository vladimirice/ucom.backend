const models = require('../../../models');

const SOURCES_TABLE_NAME = 'entity_sources';

class EntityModelProvider {

  /**
   *
   * @return {string}
   */
  static getSourcesTableName() {
    return SOURCES_TABLE_NAME;
  }

  /**
   *
   * @return {Object}
   */
  static getSourcesModel() {
    return models[SOURCES_TABLE_NAME];
  }
}

module.exports = EntityModelProvider;