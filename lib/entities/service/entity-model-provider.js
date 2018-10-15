const models = require('../../../models');

const SOURCES_TABLE_NAME        = 'entity_sources';
const NOTIFICATIONS_TABLE_NAME  = 'entity_notifications';

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
   * @return {string}
   */
  static getNotificationsTableName() {
    return NOTIFICATIONS_TABLE_NAME;
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