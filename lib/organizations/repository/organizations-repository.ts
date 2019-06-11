/* tslint:disable:max-line-length */

import { QueryBuilder } from 'knex';
import { OrgIdToOrgModelCard, OrgModel, OrgModelResponse } from '../interfaces/model-interfaces';
import { DbParamsDto, QueryFilteredRepository } from '../../api/filters/interfaces/query-filter-interfaces';
import { ModelWithEventParamsDto } from '../../stats/interfaces/dto-interfaces';
import { RequestQueryBlockchainNodes } from '../../blockchain-nodes/interfaces/blockchain-nodes-interfaces';

import knex = require('../../../config/knex');
import OrganizationsModelProvider = require('../service/organizations-model-provider');
import EntityListCategoryDictionary = require('../../stats/dictionary/entity-list-category-dictionary');
import PostsRepository = require('../../posts/posts-repository');
import UsersTeamRepository = require('../../users/repository/users-team-repository');
import RepositoryHelper = require('../../common/repository/repository-helper');
import OrgsCurrentParamsRepository = require('./organizations-current-params-repository');
import QueryFilterService = require('../../api/filters/query-filter-service');
import EnvHelper = require('../../common/helper/env-helper');

const _ = require('lodash');

const { orgDbModel } = require('../models/organizations-model');

const orgModelProvider = require('../../organizations/service/organizations-model-provider');
const usersModelProvider = require('../../users/users-model-provider');
const usersTeamStatusDictionary = require('../../users/dictionary/users-team-status-dictionary');

const TABLE_NAME = orgModelProvider.getModelName();
const ENTITY_NAME = orgModelProvider.getEntityName();
const model = orgModelProvider.getModel();

const models = require('../../../models');

const db = models.sequelize;
const { Op } = models.Sequelize;


const taggableRepository = require('../../common/repository/taggable-repository');

// @ts-ignore
class OrganizationsRepository implements QueryFilteredRepository {
  public static async isOrgMember(userId: number, orgId: number): Promise<boolean> {
    const state = await this.getUserTeamMemberState(userId, orgId);

    return state.isOrgAuthor || state.isTeamMember;
  }

  public static async getUserTeamMemberState(
    userId: number,
    orgId: number,
  ): Promise<{ isOrgAuthor: boolean, isTeamMember: boolean}> {
    const isOrgAuthor = await this.isUserAuthor(orgId, userId);

    const isTeamMember = await UsersTeamRepository.isTeamMember(
      ENTITY_NAME,
      orgId,
      userId,
    );

    return {
      isOrgAuthor,
      isTeamMember,
    };
  }

  public static async findManyOrgsEntityEvents(
    limit: number,
    lastId: number | null = null,
  ): Promise<ModelWithEventParamsDto[]> {
    const queryBuilder = knex(TABLE_NAME)
      .select(['id', 'blockchain_id', 'current_rate'])
      .orderBy('id', 'ASC')
      .limit(limit)
    ;

    if (lastId) {
      queryBuilder.whereRaw(`id > ${+lastId}`);
    }

    return queryBuilder;
  }

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async createNewOrganization(data, transaction) {
    return this.getOrganizationModel().create(data, { transaction });
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
      raw: true,
    });

    return res ? +res.user_id : null;
  }

  /**
   *
   * @param {number} orgId
   * @return {Promise<void>}
   */
  static async findAllTeamMembersIds(orgId) {
    const orgEntityName = orgModelProvider.getEntityName();
    const usersTeamTableName = usersModelProvider.getUsersTeamTableName();

    const status = usersTeamStatusDictionary.getStatusConfirmed();

    const sql = `
        SELECT user_id from ${usersTeamTableName}
        WHERE
          entity_name = '${orgEntityName}'
          AND entity_id = ${+orgId}
          AND status = ${status}
        ;
    `;

    const data = await db.query(sql, { type: db.QueryTypes.SELECT });

    return data.map(row => row.user_id);
  }

  /**
   *
   * @param {string} query
   * @returns {Promise<Array<Object>>}
   */
  static async findByNameFields(query) {
    const attributes = orgModelProvider.getModel().getFieldsForPreview();
    const searchFields = model.getFieldsForSearch();

    let search = '';
    searchFields.forEach((field) => {
      if (search === '') {
        search += `${field} ILIKE $query `;
      } else {
        search += `OR ${field} ILIKE $query `;
      }
    });

    const sql = `SELECT ${attributes.join(',')} FROM ${TABLE_NAME} WHERE ${search}`;

    return db.query(sql, {
      bind: {
        query: `%${query}%`,
      },
      type: db.QueryTypes.SELECT,
    });
  }

  static async countAllOrganizations(params: DbParamsDto | null = null): Promise<number> {
    const query = knex(TABLE_NAME).count(`${TABLE_NAME}.id AS amount`);

    orgDbModel.prototype.addCurrentParamsLeftJoin(query);

    if (params && params.whereRaw) {
      // noinspection JSIgnoredPromiseFromCall
      query.whereRaw(params.whereRaw);
    }

    const res = await query;

    return +res[0].amount;
  }

  public static async countManyOrganizationsAsRelatedToEntity(
    params: DbParamsDto,
    statsFieldName: string,
    relatedEntityField: string,
    overviewType: string,
  ): Promise<number> {
    const relEntityNotNull = true;
    const subQuery = PostsRepository.prepareSubQueryForCounting(
      overviewType,
      relatedEntityField,
      statsFieldName,
      params,
      relEntityNotNull,
    );

    const sql = `
    SELECT COUNT(1) as amount FROM
      (
        ${subQuery}
      ) AS t
    `;

    const res = await knex.raw(sql);

    return +res.rows[0].amount;
  }

  /**
   *
   * @param {string} field
   * @returns {Promise<Object>}
   */
  static async findMinOrgIdByParameter(field) {
    const order: any = [];

    order[0] = [field, 'ASC'];
    order[1] = ['id', 'DESC'];

    const result = await model.findOne({
      order,
      attributes: ['id'],

      raw: true,
      limit: 1,
    });

    return result ? result.id : null;
  }

  /**
   *
   * @param {string} field
   * @returns {Promise<Object>}
   */
  static async findMaxOrgIdByParameter(field) {
    const order: any = [];

    order[0] = [field, 'DESC'];
    order[1] = ['id', 'DESC'];

    const result = await model.findOne({
      order,
      attributes: ['id'],
      limit: 1,
      raw: true,
    });

    return result ? result.id : null;
  }

  static async isUserAuthor(id, userId) {
    const where = {
      id,
      user_id: userId,
    };

    const result = await this.getOrganizationModel().count({
      where,
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
        id,
      },
    });

    return !!res;
  }

  /**
   *
   * @param {Object} where
   * @param {Array} modelsToInclude
   * @return {Promise<Object>}
   */
  static async findOneBy(where, modelsToInclude = null) {
    const include = this.getIncludeByKeys(modelsToInclude);

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
  private static getIncludeByKeys(fieldsToInclude) {
    if (!fieldsToInclude) {
      return [];
    }

    const include = {
      Users: {
        attributes: models.Users.getFieldsForPreview(),
        model: models.Users,
      },
      users_team: usersModelProvider.getUsersTeamIncludeWithUsersOnly('org'),
    };

    const result: any = [];
    fieldsToInclude.forEach((field) => {
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
    return orgModelProvider.getModel().findOne({
      where: { id },
      raw: true,
    });
  }

  /**
   *
   * @param {number} id
   * @param {number|null} teamStatus
   * @return {Promise<Object>}
   */
  static async findOneById(id: number, teamStatus: number | null = null) {
    const usersTeamStatus = teamStatus === null ?
      usersTeamStatusDictionary.getStatusConfirmed() : teamStatus;

    const result = await this.getOrganizationModel().findOne({
      include: [
        usersModelProvider.getUsersTeamIncludeWithUsersOnly('org', usersTeamStatus),
      ],
      where: {
        id,
      },
    });

    return result ? result.toJSON() : null;
  }

  static async findOneByIdForPreview(id: number): Promise<OrgModel | null> {
    return this.getOrganizationModel().findOne({
      attributes: orgModelProvider.getModel().getFieldsForPreview(),
      where: { id },
      raw: true,
    });
  }

  static async findManyOrgsByIdForCard(ids: number[]): Promise<OrgIdToOrgModelCard> {
    // noinspection TypeScriptValidateJSTypes
    const data: OrgModel[] = await this.getOrganizationModel().findAll({
      attributes: orgModelProvider.getModel().getFieldsForPreview(),
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      raw: true,
    });

    const res: OrgIdToOrgModelCard = {};

    data.forEach((item) => {
      // @ts-ignore
      res[item.id] = item;
    });

    return res;
  }

  static async findFirstIdByAuthorId(userId) {
    const res = await orgModelProvider.getModel().findOne({
      attributes: ['id'],
      where: {
        user_id: userId,
      },
      order: [
        ['id', 'ASC'],
      ],
      limit: 1,
      raw: true,
    });

    return res ? res.id : null;
  }

  /**
   *
   * @param {Object} fieldsValues
   * @return {Promise<Object>}
   */
  static async findWithUniqueFields(fieldsValues) {
    const opOrConditions: any = [];

    for (const property in fieldsValues) {
      if (fieldsValues.hasOwnProperty(property)) {
        opOrConditions.push({
          [property]: fieldsValues[property],
        });
      }
    }

    const attributes = Array.prototype.concat(Object.keys(fieldsValues), ['id']);

    // noinspection TypeScriptValidateJSTypes
    return this.getOrganizationModel().findAll({
      attributes,
      where: {
        [Op.or]: opOrConditions,
      },
      raw: true,
    });
  }

  static async findLastByAuthor(userId) {
    const includeUsersPreview =
      usersModelProvider.getUsersTeamIncludeWithUsersOnly('org', usersTeamStatusDictionary.getStatusConfirmed());

    const result = await this.getOrganizationModel().findOne({
      where: { user_id: userId },
      include: [
        includeUsersPreview,
      ],
      order: [
        ['id', 'DESC'],
      ],
      limit: 1,
      raw: false,
    });

    return result ? result.toJSON() : null;
  }

  static async findLastIdByAuthor(userId) {
    const res =  await this.getOrganizationModel().findOne({
      attributes: ['id'],
      where: { user_id: userId },
      order: [
        ['id', 'DESC'],
      ],
      limit: 1,
      raw: true,
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
      attributes: ['id', 'blockchain_id'],
      where: {
        blockchain_id: blockchainIds,
      },
      raw: true,
    });

    const res = {};
    data.forEach((item) => {
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
      attributes: ['blockchain_id'],
      where: { id },
      raw: true,
    });

    return res ? res.blockchain_id : null;
  }

  static async findFirstByAuthor(userId) {
    return this.getOrganizationModel().findOne({
      where: { user_id: userId },
      order: [
        ['id', 'ASC'],
      ],
      limit: 1,
      raw: true,
    });
  }

  static async findAllForPreviewByUserId(userId) {
    const mainPreviewAttributes = models[TABLE_NAME].getFieldsForPreview();

    return models[TABLE_NAME].findAll({
      attributes: mainPreviewAttributes,
      where: {
        user_id: userId,
      },
      raw: true,
    });
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<void>}
   */
  static async findAllAvailableForUser(userId) {
    const status = usersTeamStatusDictionary.getStatusConfirmed();

    const mainPreviewAttributes = models[TABLE_NAME].getFieldsForPreview();

    const toSelect = mainPreviewAttributes.join(',');

    const sql = `
    SELECT ${toSelect} from organizations
      WHERE user_id = ${+userId} OR id IN (
        SELECT entity_id FROM users_team WHERE user_id = ${+userId} AND entity_name = 'org' AND status = ${status}
      );
    `;

    return models.sequelize.query(sql, { type: db.QueryTypes.SELECT });
  }

  public static getQueryBuilder(): QueryBuilder {
    return knex(TABLE_NAME);
  }

  public static async findAllOrgForList(
    params: DbParamsDto,
  ): Promise<OrgModelResponse[]> {
    QueryFilterService.addExtraAttributes(
      params,
      OrgsCurrentParamsRepository.getStatsFields(),
      OrganizationsModelProvider.getCurrentParamsTableName(),
    );

    const res = await orgDbModel.prototype.findAllOrgsBy(params).fetchAll();
    const numericalFields = this.getNumericalFields()
      .concat(OrgsCurrentParamsRepository.getStatsFields(), ['number_of_followers']);

    const jsonModels: OrgModelResponse[] = res.toJSON();
    RepositoryHelper.convertStringFieldsToNumbersForArray(
      jsonModels,
      numericalFields,
      this.getFieldsToDisallowZero(),
    );

    return jsonModels;
  }

  public static async findManyAsRelatedToEntity(
    params: DbParamsDto,
    statsFieldName: string,
    relEntityField: string,
    overviewType: string,
  ): Promise<OrgModelResponse[]> {
    const relEntityNotNull = true;
    const { postSubQuery, extraFieldsToSelect } =
      PostsRepository.prepareRelatedEntitySqlParts(overviewType, params, statsFieldName, relEntityField, relEntityNotNull);

    const sql = `
      select ${params.attributes}
             ${extraFieldsToSelect}
      from "organizations" INNER JOIN
            ${postSubQuery}
           ON t.${relEntityField} = "organizations".id
      ORDER BY t.${statsFieldName} DESC
    `;

    const data = await knex.raw(sql);

    return data.rows;
  }

  /**
   *
   * @param tagTitle
   * @param givenParams
   * @returns {Promise<Object>}
   */
  static async findAllByTagTitle(tagTitle, givenParams) {
    const params = _.defaults(givenParams, this.getDefaultListParams());
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

  public static async countAllWithoutFilter(): Promise<number> {
    const res = await knex(TABLE_NAME).count(`${TABLE_NAME}.id AS amount`);

    return +res[0].amount;
  }

  public static getDefaultListParams(): DbParamsDto {
    return {
      attributes: model.getFieldsForPreview(),
      where: {},
      limit: 10,
      offset: 0,
      order: this.getDefaultOrderBy(),
    };
  }

  private static getDefaultOrderBy(): string[][] {
    return [
      ['current_rate', 'DESC'],
      ['id', 'DESC'],
    ];
  }

  public static getOrderByRelationMap() {
    return {};
  }

  // noinspection JSUnusedGlobalSymbols - is used in query service
  public static getAllowedOrderBy(): string[] {
    return [
      'id',
      'title',
      'current_rate',
      'created_at',
      'importance_delta',
      'activity_index_delta',
    ];
  }

  // noinspection JSUnusedGlobalSymbols @see QueryFilterService
  static getWhereProcessor(): Function {
    return (query, params) => {
      params.where = {};

      if (query.overview_type && query.overview_type === EntityListCategoryDictionary.getTrending()) {
        params.whereRaw = this.whereRawTrending();
      }
      if (query.overview_type && query.overview_type === EntityListCategoryDictionary.getHot()) {
        params.whereRaw = this.whereRawHot();
      }
    };
  }

  public static whereRawTrending(): string {
    const lowerLimit = EnvHelper.isStagingEnv() ? (-100) : 0;
    const tableName = OrganizationsModelProvider.getCurrentParamsTableName();

    // importance_delta criterion is disabled due to a low number of trending communities. This is an experiment
    // return `${tableName}.importance_delta > ${lowerLimit} AND ${tableName}.posts_total_amount_delta > ${lowerLimit}`;
    return `${tableName}.posts_total_amount_delta > ${lowerLimit}`;
  }

  public static whereRawHot(): string {
    const lowerLimit = EnvHelper.isStagingEnv() ? (-100) : 0;
    const tableName = OrganizationsModelProvider.getCurrentParamsTableName();

    return `${tableName}.activity_index_delta > ${lowerLimit}`;
  }

  public static getIncludeProcessor(): Function {
    // @ts-ignore
    return (query, params) => {
      params.include = [
        orgModelProvider.getIncludeForPreview(),
        usersModelProvider.getIncludeAuthorForPreview(),
      ];
    };
  }

  static async doesExistWithUserId(id, userId) {
    const res = await this.getOrganizationModel().count({
      where: {
        id,
        user_id: userId,
      },
    });

    return !!res;
  }

  /**
   *
   * @return {Object}
   */
  static getOrganizationModel() {
    return models[this.getOrganizationsModelName()];
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
   * @see usersModelProvider - required to create special methods
   * @return {Object}
   */
  static getIncludeModelAsPreview() {
    return {
      attributes: this.getFieldsForPreview(),
      model: this.getOrganizationModel(),
    };
  }

  /**
   *
   * @return {string[]}
   */
  static getModelSimpleTextFields() {
    return model.getSimpleTextFields();
  }

  public static addWhere(query: RequestQueryBlockchainNodes, queryBuilder: QueryBuilder) {
    if (!query.filters) {
      return;
    }

    if (query.filters.title_like) {
      queryBuilder.andWhere('title', 'ilike', `%${query.filters.title_like}%`);
    }
  }

  public static getNumericalFields(): string[] {
    return [
      'id',
      'user_id',
      'current_rate',
    ];
  }

  public static getFieldsToDisallowZero(): string[] {
    return [
      'id',
      'user_id',
    ];
  }
}

export = OrganizationsRepository;
