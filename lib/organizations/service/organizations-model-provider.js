const models = require('../../../models');

const ENTITY_NAME = 'org       ';

const TABLE_NAME = 'organizations';

class OrganizationsModelProvider {

  /**
   *
   * @return {string}
   */
  static getEntityName() {
    return ENTITY_NAME;
  }

  /**
   *
   * @return {string}
   */
  static getModelName() {
    return TABLE_NAME;
  }

  /**
   *
   * @return {Object}
   */
  static getModel() {
    return models[TABLE_NAME];
  }
}

module.exports = OrganizationsModelProvider;