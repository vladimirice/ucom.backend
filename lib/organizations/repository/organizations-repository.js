const TABLE_NAME = 'organizations';
const models = require('../../../models');
const model = models[TABLE_NAME];

const db = models.sequelize;
const Op = db.Op;

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
   * @param {Object} where
   * @param {Array} modelsToInclude
   * @return {Promise<Object>}
   */
  static async findOneBy(where, modelsToInclude) {
    const include = this._getIncludeByKeys(modelsToInclude);

    return await this.getOrganizationModel().findOne({
      where,
      include,
      raw: true,
    });
  }

  /**
   *
   * @param {Array} fieldsToInclude
   * @return {Array}
   * @private
   */
  static _getIncludeByKeys(fieldsToInclude) {
    const include = {
      'Users': {
        attributes: models.Users.getFieldsForPreview(),
        model: models.Users,
      },
    };

    let result = [];
    fieldsToInclude.forEach(field => {
      if (!include[field]) {
        throw new Error(`It is not possible to include field ${field}`);
      }

      result.push(include[field]);
    });

    return result;
  }

  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOneById(id) {
    return await this.getOrganizationModel().findOne({
      where: {
        id
      },
      raw: true,
    });
  }


  /**
   *
   * @param {Object} fieldsValues
   * @return {Promise<Object>}
   */
  static async findOneWithUniqueFields(fieldsValues) {
    let opOrConditions = [];

    for (const property in fieldsValues) {
      if (fieldsValues.hasOwnProperty(property)) {
        opOrConditions.push({
          [property]: fieldsValues[property]
        });
      }
    }


    return await this.getOrganizationModel().findOne({
      attributes: Object.keys(fieldsValues),
      where: {
        [Op.or]: opOrConditions
      },
      raw: true
    });
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<Object>}
   */
  static async findLastByAuthor(user_id) {
    return await this.getOrganizationModel().findOne({
      where: { user_id },
      order: [
        ['id', 'DESC']
      ],
      limit: 1,
      raw: true
    });
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<Object|null>}
   */
  static async findLastIdByAuthor(user_id) {
    const res =  await this.getOrganizationModel().findOne({
      attributes: [ 'id' ],
      where: { user_id },
      order: [
        ['id', 'DESC']
      ],
      limit: 1,
      raw: true
    });

    return res ? res.id : null;
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<Object>}
   */
  static async findFirstByAuthor(user_id) {
    return await this.getOrganizationModel().findOne({
      where: { user_id },
      order: [
        ['id', 'ASC']
      ],
      limit: 1,
      raw: true
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