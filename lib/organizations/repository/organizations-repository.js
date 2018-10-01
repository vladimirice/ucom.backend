const OrgModelProvider = require('../../organizations/service/organizations-model-provider');
const UsersModelProvider = require('../../users/users-model-provider');

const TABLE_NAME = OrgModelProvider.getModelName();
const model = OrgModelProvider.getModel();

const models = require('../../../models');


const _ = require('lodash');

const db = models.sequelize;
const Op = db.Op;

class OrganizationsRepository {

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async createNewOrganization(data, transaction) {
    return await this.getOrganizationModel().create(data, { transaction });
  }

  /**
   *
   * @param {string} query
   * @returns {Promise<Array<Object>>}
   */
  static async findByNameFields(query) {
    const attributes = OrgModelProvider.getModel().getFieldsForPreview();
    const searchFields = model.getFieldsForSearch();

    let search = '';
    searchFields.forEach(field => {
      if (search === '') {
        search += `${field} ILIKE $query `;
      } else {
        search += `OR ${field} ILIKE $query `
      }
    });

    const sql = `SELECT ${attributes.join(',')} FROM ${TABLE_NAME} WHERE ${search}`;

    console.log(sql);

    return await db.query(sql, {
      bind: {
        'query': `%${query}%`
      },
      type: db.QueryTypes.SELECT
    });
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
   * @param {number} user_id
   * @return {Promise<boolean>}
   */
  static async isUserAuthor(id, user_id) {
    const where = {
      id,
      user_id
    };

    const result = await this.getOrganizationModel().count({
      where
    });

    return !!result;
  }


  /**
   *
   * @param {number} id
   * @return {Promise<boolean>}
   */
  static async doesExistById(id) {
    const res = await this.getOrganizationModel().count({
      where: {
        id
      }
    });

    return !!res;
  };

  /**
   *
   * @param {Object} where
   * @param {Array} modelsToInclude
   * @return {Promise<Object>}
   */
  static async findOneBy(where, modelsToInclude = null) {
    const include = this._getIncludeByKeys(modelsToInclude);

    const result = await this.getOrganizationModel().findOne({
      where,
      include,
    });

    return result ? result.toJSON() : null;
  }

  /**
   *
   * @param {Array} fieldsToInclude
   * @return {Array}
   * @private
   */
  static _getIncludeByKeys(fieldsToInclude) {
    if (!fieldsToInclude) {
      return [];
    }

    const include = {
      'Users': {
        attributes: models.Users.getFieldsForPreview(),
        model: models.Users,
      },
      'users_team': UsersModelProvider.getUsersTeamIncludeWithUsersOnly('org'),
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
    const result = await this.getOrganizationModel().findOne({
      include: [
        UsersModelProvider.getUsersTeamIncludeWithUsersOnly('org'),
      ],
      where: {
        id
      },
    });

    return result ? result.toJSON() : null;
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<number>}
   */
  static async findFirstIdByAuthorId(user_id) {
    const res = await OrgModelProvider.getModel().findOne({
      attributes: ['id'],
      where: {
        user_id,
      },
      order: [
        ['id', 'ASC']
      ],
      limit: 1,
      raw: true
    });

    return res ? res.id : null;
  }


  /**
   *
   * @param {Object} fieldsValues
   * @return {Promise<Object>}
   */
  static async findWithUniqueFields(fieldsValues) {
    let opOrConditions = [];

    for (const property in fieldsValues) {
      if (fieldsValues.hasOwnProperty(property)) {
        opOrConditions.push({
          [property]: fieldsValues[property]
        });
      }
    }

    const attributes = _.concat(Object.keys(fieldsValues), ['id']);

    return await this.getOrganizationModel().findAll({
      attributes: attributes,
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
    const includeUsersPreview = UsersModelProvider.getUsersTeamIncludeWithUsersOnly('org');

    const result = await this.getOrganizationModel().findOne({
      where: { user_id },
      include: [
        includeUsersPreview
      ],
      order: [
        ['id', 'DESC']
      ],
      limit: 1,
      raw: false
    });

    return result ? result.toJSON() : null;
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
   * @param {number} id
   * @return {Promise<Object|null>}
   */
  static async findBlockchainIdById(id) {
    const res =  await this.getOrganizationModel().findOne({
      attributes: [ 'blockchain_id' ],
      where: { id },
      raw: true
    });

    return res ? res.blockchain_id : null;
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

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} user_id
   * @return {Promise<void>}
   */
  static async findAllForPreviewByUserId(user_id) {
    const mainPreviewAttributes = models[TABLE_NAME].getFieldsForPreview();

    return await models[TABLE_NAME].findAll({
      attributes: mainPreviewAttributes,
      where: {
        user_id
      },
      raw: true,
    });
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<void>}
   */
  static async findAllAvailableForUser(user_id) {
    const mainPreviewAttributes = models[TABLE_NAME].getFieldsForPreview();

    const toSelect = mainPreviewAttributes.join(',');

    const sql = `
    SELECT ${toSelect} from organizations
      WHERE user_id = ${+user_id} OR id IN (
        SELECT entity_id FROM users_team WHERE user_id = ${+user_id} AND entity_name = 'org'
      );
    `;

    const res = await models.sequelize.query(sql);

    return res[0];
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
   * @param {number} id
   * @param {number} user_id
   * @return {boolean}
   */
  static async doesExistWithUserId(id, user_id) {
    const res = await this.getOrganizationModel().count({
      where: {
        id,
        user_id
      }
    });

    return !!res;
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

  // noinspection JSUnusedGlobalSymbols
  /**
   * @deprecated
   * @see UsersModelProvider - required to create special methods
   * @return {Object}
   */
  static getIncludeModelAsPreview() {
    return {
        attributes: this.getFieldsForPreview(),
        model: this.getOrganizationModel(),
    }
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