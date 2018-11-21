const models = require('../../../models');

const ENTITY_NAME = 'org       ';

const TABLE_NAME = 'organizations';

class OrganizationsModelProvider {


  static getOrgFieldsForPreview() {
    return this.getModel().getFieldsForPreview()
  }

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
  static getOrganizationSingularName() {
    return 'organization';
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
   * @return {string}
   */
  static getTableName() {
    return TABLE_NAME;
  }

  /**
   *
   * @return {string}
   */
  static getBlockchainIdFieldName() {
    return 'blockchain_id'
  }

  /**
   *
   * @return {Object}
   */
  static getModel() {
    return models[TABLE_NAME];
  }

  /**
   *
   * @return {Object}
   */
  static getIncludeForPreview(required = false) {
    return {
      model: this.getModel(),
      attributes: this.getModel().getFieldsForPreview(),
      required
    }
  }
}

module.exports = OrganizationsModelProvider;