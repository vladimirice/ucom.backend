const TABLE_NAME = 'organizations';
const models = require('../../../models');
const model = models[TABLE_NAME];

const db = models.sequelize;

class OrganizationsRepository {

  /**
   *
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async createNewOrganization(data) {
    return await OrganizationsRepository.getOrganizationModel().create(data);
  }

  /**
   *
   * @param {Object | null} queryParameters
   * @returns {Promise<number>}
   */
  static async countAllOrganizations(queryParameters = null) {
    return await this.getOrganizationModel().count({
      where: queryParameters ? queryParameters.where : {},
    });
  }

  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOneById(id) {
    const data = await this.getOrganizationModel().findOne({
      where: {
        id
      },
      raw: true,
    });

    return data;
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<Object>}
   */
  static async findLastByAuthor(user_id) {
    const data = await this.getOrganizationModel().findOne({
      where: { user_id },
      order: [
        ['id', 'DESC']
      ],
      limit: 1,
      raw: true
    });

    return data;
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<Object>}
   */
  static async findFirstByAuthor(user_id) {
    const data = await this.getOrganizationModel().findOne({
      where: { user_id },
      order: [
        ['id', 'ASC']
      ],
      limit: 1,
      raw: true
    });

    return data;
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
    return model.getFieldsForPreview();
  }

  /**
   *
   * @return {string[]}
   */
  static getModelSimpleTextFields() {
    return model.getSimpleTextFields();
  }
}

module.exports = OrganizationsRepository;