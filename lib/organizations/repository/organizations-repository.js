const TABLE_NAME = 'organizations';
const models = require('../../../models');

class OrganizationsRepository {


  /**
   *
   * @param {Object | null} queryParameters
   * @returns {Promise<number>}
   */
  static async countAllOrganizations(queryParameters = null) {
    return await this.getOrganizationModel().count({
      where: queryParameters ? queryParameters['where'] : {},
    });
  }

  /**
   *
   * @return {Promise<Object>}
   */
  static async findAllForPreview() {
    const mainPreviewAttributes = models[TABLE_NAME].getFieldsForPreview();

    return await models[TABLE_NAME].findAll({
      attributes: mainPreviewAttributes,
      raw: true,
    });
  }

  /**
   *
   * @return {Object}
   */
  static getOrganizationModel() {
    return models[this.getOrganizationsModelName()]
  }

  /**
   *
   * @return {string}
   */
  static getOrganizationsModelName() {
    return TABLE_NAME;
  }

  /**
   *
   * @return {string[]}
   */
  static getFieldsForPreview() {
    return models[TABLE_NAME].getFieldsForPreview();
  }
}

module.exports = OrganizationsRepository;