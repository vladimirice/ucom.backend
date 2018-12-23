const OrgModelProvider = require('../../organizations/service/organizations-model-provider');
const UsersModelProvider = require('../../users/users-model-provider');
const UsersTeamStatusDictionary = require('../../users/dictionary/users-team-status-dictionary');

const TABLE_NAME = OrgModelProvider.getModelName();
const model = OrgModelProvider.getModel();

const models = require('../../../models');

const _ = require('lodash');

const db = models.sequelize;
const Op = db.Op;

const taggableRepository = require('../../common/repository/taggable-repository');

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
   * @param {number} id
   * @return {Promise<number>}
   */
  static async getAuthorIdByOrgId(id) {
    const res = await this.getOrganizationModel().findOne({
      attributes: ['user_id'],
      where: { id },
      raw: true
    });

    return res ? +res.user_id : null
  }

  /**
   *
   * @param {number} orgId
   * @return {Promise<void>}
   */
  static async findAllTeamMembersIds(orgId) {
    const orgEntityName = OrgModelProvider.getEntityName();
    const usersTeamTableName = UsersModelProvider.getUsersTeamTableName();

    const status = UsersTeamStatusDictionary.getStatusConfirmed();

    const sql = `
        SELECT user_id from ${usersTeamTableName}
        WHERE 
          entity_name = '${orgEntityName}'
          AND entity_id = ${+orgId}
          AND status = ${status}
        ;
    `;

    const data = await db.query(sql, { type: db.QueryTypes.SELECT });

    return data.map(row => {
      return row.user_id
    })
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
   * @param {string} field
   * @returns {Promise<Object>}
   */
  static async findMinOrgIdByParameter(field) {
    let order = [];

    order[0] = [field, 'ASC'];
    order[1] = ['id', 'DESC'];

    const result = await model.findOne({
      attributes: [ 'id' ],
      raw: true,

      limit: 1,
      order,
    });

    return result ? result['id'] : null;
  }

  /**
   *
   * @param {string} field
   * @returns {Promise<Object>}
   */
  static async findMaxOrgIdByParameter(field) {
    let order = [];

    order[0] = [field, 'DESC'];
    order[1] = ['id', 'DESC'];

    const result = await model.findOne({
      attributes: [ 'id' ],
      limit: 1,
      order,
      raw: true
    });

    return result ? result['id'] : null;
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
  static async findOnlyItselfById(id) {
    return await OrgModelProvider.getModel().findOne({
      where: { id },
      raw: true
    });
  }

  /**
   *
   * @param {number} id
   * @param {number|null} teamStatus
   * @return {Promise<Object>}
   */
  static async findOneById(id, teamStatus = null) {
    const usersTeamStatus = teamStatus === null ? UsersTeamStatusDictionary.getStatusConfirmed() : teamStatus;

    const result = await this.getOrganizationModel().findOne({
      include: [
        UsersModelProvider.getUsersTeamIncludeWithUsersOnly('org', usersTeamStatus),
      ],
      where: {
        id
      },
    });

    return result ? result.toJSON() : null;
  }

  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOneByIdForPreview(id) {
    return await this.getOrganizationModel().findOne({
      attributes: OrgModelProvider.getModel().getFieldsForPreview(),
      where: {
        id
      },
      raw: true
    });
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
    const includeUsersPreview =
      UsersModelProvider.getUsersTeamIncludeWithUsersOnly('org', UsersTeamStatusDictionary.getStatusConfirmed());

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
   * @param {string[]} blockchainIds
   * @return {Promise<Object>}
   */
  static async findIdsByBlockchainIds(blockchainIds) {
    const data =  await this.getOrganizationModel().findAll({
      attributes: [ 'id', 'blockchain_id' ],
      where: {
        blockchain_id: blockchainIds,
      },
      raw: true
    });

    const res = {};
    data.forEach(item => {
      res[item.blockchain_id] = item.id;
    });

    return res;
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
    const status = UsersTeamStatusDictionary.getStatusConfirmed();

    const mainPreviewAttributes = models[TABLE_NAME].getFieldsForPreview();

    const toSelect = mainPreviewAttributes.join(',');

    const sql = `
    SELECT ${toSelect} from organizations
      WHERE user_id = ${+user_id} OR id IN (
        SELECT entity_id FROM users_team WHERE user_id = ${+user_id} AND entity_name = 'org' AND status = ${status}
      );
    `;

    return await models.sequelize.query(sql, { type: db.QueryTypes.SELECT });
  }

  /**
   *
   * @return {Promise<Object[]>}
   */
  static async findAllOrgForList(givenParams = {}) {
    const params = _.defaults(givenParams, this._getDefaultListParams());

    params.attributes = model.getFieldsForPreview();
    params.raw = true;

    return await model.findAll(params);
  }

  /**
   *
   * @param tagTitle
   * @param givenParams
   * @returns {Promise<Object>}
   */
  static async findAllByTagTitle(tagTitle, givenParams) {
    const params = _.defaults(givenParams, this._getDefaultListParams());
    params.attributes = model.getFieldsForPreview();
    params.main_table_alias = 't';
    const joinColumn = 'org_id';

    return taggableRepository.findAllByTagTitle(TABLE_NAME, tagTitle, joinColumn, params);
  }

  /**
   *
   * @param {string} tagTitle
   * @returns {Promise<Knex.QueryBuilder>}
   */
  static async countAllByTagTitle(tagTitle) {
    const joinColumn = 'org_id';

    return taggableRepository.countAllByTagTitle(TABLE_NAME, tagTitle, joinColumn);
  }

  static _getDefaultListParams() {
    return {
      where: {},
      limit: 10,
      offset: 0,
      order: this._getDefaultOrderBy()
    };
  }

  static _getDefaultOrderBy() {
    return [
      ['current_rate', 'DESC'],
      ['id', 'DESC']
    ];
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