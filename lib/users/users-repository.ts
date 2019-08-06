import { QueryBuilder } from 'knex';
import { UserIdToUserModelCard, UserModel, UsersRequestQueryDto } from './interfaces/model-interfaces';
import { OrgModel, OrgModelResponse } from '../organizations/interfaces/model-interfaces';
import { DbParamsDto, RequestQueryDto } from '../api/filters/interfaces/query-filter-interfaces';
import { AppError } from '../api/errors';
import { StringToAnyCollection } from '../common/interfaces/common-types';

import knex = require('../../config/knex');
import PostsModelProvider = require('../posts/service/posts-model-provider');
import PostsRepository = require('../posts/posts-repository');
import UsersModelProvider = require('./users-model-provider');
import UsersExternalModelProvider = require('../users-external/service/users-external-model-provider');
import AirdropsModelProvider = require('../airdrops/service/airdrops-model-provider');
import ExternalTypeIdDictionary = require('../users-external/dictionary/external-type-id-dictionary');
import UosAccountsModelProvider = require('../uos-accounts-properties/service/uos-accounts-model-provider');
import AirdropsUsersRepository = require('../airdrops/repository/airdrops-users-repository');
import EntityListCategoryDictionary = require('../stats/dictionary/entity-list-category-dictionary');
import EnvHelper = require('../common/helper/env-helper');
import QueryFilterService = require('../api/filters/query-filter-service');
import KnexQueryBuilderHelper = require('../common/helper/repository/knex-query-builder-helper');
import RepositoryHelper = require('../common/repository/repository-helper');
import OrganizationsModelProvider = require('../organizations/service/organizations-model-provider');

const _ = require('lodash');

const models = require('../../models');
const userModelProvider = require('./users-model-provider');

const { Op } = models.Sequelize;
const db = models.sequelize;

const model = userModelProvider.getUsersModel();

const TABLE_NAME = 'Users';
const usersExternal = UsersExternalModelProvider.usersExternalTableName();
const airdropsUsersExternalData = AirdropsModelProvider.airdropsUsersExternalDataTableName();

const taggableRepository = require('../common/repository/taggable-repository');

class UsersRepository {
  public static async findAllAirdropParticipants(
    airdropId: number,
    params: DbParamsDto,
  ) {
    const queryBuilder = knex(TABLE_NAME)
      .select([
        `${airdropsUsersExternalData}.score AS score`,
        `${usersExternal}.external_login AS external_login`,
      ])
      .innerJoin(usersExternal, `${usersExternal}.user_id`, `${TABLE_NAME}.id`)
      // eslint-disable-next-line func-names
      .innerJoin(airdropsUsersExternalData, function () {
        // @ts-ignore
        this.on(`${airdropsUsersExternalData}.users_external_id`, '=', `${usersExternal}.id`);
      })
      .andWhere(`${usersExternal}.external_type_id`, ExternalTypeIdDictionary.github())
      .andWhere(`${airdropsUsersExternalData}.airdrop_id`, airdropId)
      .andWhere(`${airdropsUsersExternalData}.are_conditions_fulfilled`, true)
      .whereNotIn(`${TABLE_NAME}.id`, AirdropsUsersRepository.getAirdropParticipantsIdsToHide())
    ;

    this.addListParamsToQueryBuilder(queryBuilder, params);

    const data = await queryBuilder;
    RepositoryHelper.convertStringFieldsToNumbersForArray(data, this.getPropsFields(), []);

    return data;
  }

  public static async findManyAsRelatedToEntity(
    params: DbParamsDto,
    statsFieldName: string,
    relEntityField: string,
    overviewType: string,
    entityName: string,
  ): Promise<OrgModelResponse[]> {
    if (entityName !== PostsModelProvider.getEntityName()) {
      throw new AppError(`Unsupported entity: ${entityName}`, 500);
    }

    const relEntityNotNull = false;
    const { postSubQuery, extraFieldsToSelect } =
      PostsRepository.prepareRelatedEntitySqlParts(overviewType, params, statsFieldName, relEntityField, relEntityNotNull);

    // #task - rewrite using knex
    const sql = `
      select "Users"."id"               as "id",
             "Users"."account_name"     as "account_name",
             "Users"."first_name"       as "first_name",
             "Users"."last_name"        as "last_name",
             "Users"."nickname"         as "nickname",
             "Users"."avatar_filename"  as "avatar_filename",
             "Users"."current_rate"     as "current_rate",
             ${UsersRepository.getPropsFields().join(', ')}
             ${extraFieldsToSelect}
      from "Users" INNER JOIN
            ${postSubQuery}
           ON t.${relEntityField} = "Users".id
        INNER JOIN blockchain.uos_accounts_properties a
            ON a.entity_id = "Users".id AND a.entity_name = '${UsersModelProvider.getEntityName()}'
        INNER JOIN users_current_params p
            ON p.user_id = "Users".id
      ORDER BY t.${statsFieldName} DESC
    `;

    const data = await knex.raw(sql);

    return data.rows;
  }

  public static async countManyUsersAsRelatedToEntity(
    params: DbParamsDto,
    statsFieldName: string,
    relatedEntityField: string,
    overviewType: string,
  ): Promise<number> {
    const relEntityNotNull = false;
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

  public static async findUserIdsByAccountNames(
    accountNames: string[],
    key: string = 'account_name',
    value: string = 'id',
  ): Promise<any> {
    const data = await knex(TABLE_NAME)
      .select(['id', 'account_name'])
      .whereIn('account_name', accountNames);

    const result = {};
    data.forEach((user) => {
      result[user[key]] = user[value];
    });

    return result;
  }

  public static async findUserIdsByObjectIndexedByAccountNames(
    indexedObject: StringToAnyCollection,
    key: string = 'account_name',
    value: string = 'id',
  ): Promise<any> {
    return this.findUserIdsByAccountNames(
      Object.keys(indexedObject),
      key,
      value,
    );
  }

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @return {Promise<data>}
   */
  static async createNewUser(data, transaction) {
    return model.create(data, {
      transaction,
    });
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

    return model.findAll({
      attributes,
      where: {
        [Op.or]: opOrConditions,
      },
      raw: true,
    });
  }

  /**
   *
   * @param {number} id
   * @param {Object} data
   * @param {Object} transaction
   * @return {Promise<*>}
   */
  static async updateUserById(id, data, transaction) {
    return model.update(data, {
      transaction,
      where: {
        id,
      },
    });
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<string>}
   */
  static async findAccountNameById(id) {
    const result = await this.getModel().findOne({
      attributes: ['account_name'],
      where: { id },
      raw: true,
    });

    return result ? result.account_name : null;
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<Object>}
   */
  static async getUserWithPreviewFields(userId) {
    const attributes = model.getFieldsForPreview();

    const sql = `SELECT ${attributes.join(', ')} FROM "${TABLE_NAME}" WHERE id = ${+userId}`;

    const res = await db.query(sql, { type: db.QueryTypes.SELECT });

    return res[0];
  }

  /**
   *
   * @param {number} userId
   * @returns {Promise<any>}
   */
  static async getUserById(userId) {
    const include = [
      UsersModelProvider.getIncludeUosAccountsProperties(),
      UsersModelProvider.getIncludeUsersCurrentParams(),
      {
        model: models.users_education,
        as: 'users_education',
      },
      {
        model: models.users_jobs,
        as: 'users_jobs',
      },
      {
        model: models.users_sources,
        as: 'users_sources',
      },
    ];

    return models.Users.findOne({
      include,
      where: {
        id: userId,
      },
      order: [
        ['users_education', 'id', 'ASC'],
        ['users_jobs', 'id', 'ASC'],
        ['users_sources', 'source_type_id', 'ASC'],
      ],
    });
  }

  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOnlyItselfById(id) {
    return userModelProvider.getUsersModel().findOne({
      where: { id },
      raw: true,
    });
  }

  /**
   *
   * @param {Object} where
   * @return {Promise<Object>}
   */
  static async findOneBy(where) {
    // #task custom include based on parameter as in OrganizationRepository
    const result = await this.getModel().findOne({
      where,
    });

    return result ? result.toJSON() : null;
  }

  /**
   *
   * @param {string} query
   * @returns {Promise<Array<Object>>}
   */
  public static async findByNameFields(query) {
    const where = this.getSearchUserQueryWhere(query);

    // noinspection JSUnusedGlobalSymbols
    return this.getModel().findAll({
      attributes: this.getModel().getFieldsForPreview(),
      where,
      raw: true,
    });
  }

  static async findOneById(userId) {
    return this.getModel().findOne({
      where: {
        id: userId,
      },
    });
  }

  static async findManyUsersByIdForCard(ids: number[]): Promise<UserIdToUserModelCard> {
    // noinspection TypeScriptValidateJSTypes
    const data: OrgModel[] = await this.getModel().findAll({
      attributes: this.getModel().getFieldsForPreview(),
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      raw: true,
    });

    const res: UserIdToUserModelCard = {};

    data.forEach((item) => {
      // @ts-ignore
      res[item.id] = item;
    });

    return res;
  }

  static async findOneByIdForPreview(id: number): Promise<UserModel | null> {
    return this.getModel().findOne({
      attributes: this.getModel().getFieldsForPreview(),
      where: { id },
      raw: true,
    });
  }

  static async findOneByIdAsObject(
    userId: number,
  ): Promise<any> {
    return this.getModel().findOne({
      where: {
        id: userId,
      },
      raw: true,
    });
  }

  static async findOneByAccountNameAsObject(
    accountName: string,
  ): Promise<any> {
    return this.getModel().findOne({
      where: {
        account_name: accountName,
      },
      raw: true,
    });
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async doesUserExistWithId(
    id: number,
  ): Promise<boolean> {
    const count = await this.getModel().count({
      where: {
        id,
      },
    });

    return !!count;
  }

  static async doesUserExistWithAccountName(
    accountName: string,
  ): Promise<boolean> {
    const count = await this.getModel().count({
      where: {
        account_name: accountName,
      },
    });

    return !!count;
  }

  public static findAllWhoFollowsUser(
    userId: number,
    params: DbParamsDto,
  ): QueryBuilder {
    const activityTableName = UsersModelProvider.getUsersActivityFollowTableName();

    return UsersRepository.findAllWhoActsForUser(userId, params, activityTableName);
  }

  public static findAllWhoVoteContent(
    entityId: number,
    entityName: string,
    params: DbParamsDto,
    interactionType: number | null = null,
  ): QueryBuilder {
    const tableName = UsersModelProvider.getUsersActivityVoteTableName();

    const queryBuilder = knex(TABLE_NAME)
      .innerJoin(tableName, function () {
        this.on(`${tableName}.user_id`, `${TABLE_NAME}.id`)
          .andOn(`${tableName}.entity_name`, knex.raw(`'${entityName}'`))
          .andOn(`${tableName}.entity_id`, knex.raw(entityId));

        if (interactionType !== null) {
          this.andOn(`${tableName}.interaction_type`, knex.raw(interactionType));
        }
      });

    UsersRepository.addListParamsToQueryBuilder(queryBuilder, params);

    return queryBuilder;
  }

  public static findAllWhoFollowsOrganization(
    organizationId: number,
    params: DbParamsDto,
  ): QueryBuilder {
    const activityTableName: string = UsersModelProvider.getUsersActivityFollowTableName();

    return UsersRepository.findAllWhoActsForOrganization(organizationId, params, activityTableName);
  }

  public static async findUsersIFollow(
    userId: number,
    params: DbParamsDto,
  ) {
    const tableName = UsersModelProvider.getUsersActivityFollowTableName();

    return this.findMyActivityForOtherUsers(userId, params, tableName);
  }

  public static findManyForListViaKnex(
    query: RequestQueryDto,
    params: DbParamsDto,
  ): QueryBuilder {
    const queryBuilder = this.getQueryBuilderFilteredByRequestQuery(query);

    params.attributes = UsersModelProvider.getUserFieldsForPreview();
    const extraAttributes = UosAccountsModelProvider.getFieldsToSelect().concat(
      UsersModelProvider.getCurrentParamsToSelect(),
    );

    QueryFilterService.processAttributes(params, TABLE_NAME, true);
    QueryFilterService.addExtraAttributes(params, extraAttributes);
    QueryFilterService.addParamsToKnexQuery(queryBuilder, params);

    this.innerJoinUosAccountsProperties(queryBuilder);
    this.innerJoinUsersCurrentParams(queryBuilder);

    return queryBuilder;
  }

  public static async countManyForListViaKnex(
    query: UsersRequestQueryDto,
    params: DbParamsDto,
  ): Promise<number> {
    const queryBuilder: QueryBuilder = this.getQueryBuilderFilteredByRequestQuery(query);

    // This is legacy. Consider to move to getQueryBuilderFilteredByRequestQuery filtering
    QueryFilterService.addWhereRawParamToKnexQuery(queryBuilder, params);

    this.innerJoinUsersCurrentParams(queryBuilder);

    return KnexQueryBuilderHelper.addCountToQueryBuilderAndCalculate(queryBuilder, TABLE_NAME);
  }

  public static async findUserReferrals(
    userId: number,
    params: DbParamsDto,
  ) {
    const usersActivityReferral = UsersModelProvider.getUsersActivityReferralTableName();

    const queryBuilder = knex(TABLE_NAME)
      // eslint-disable-next-line func-names
      .innerJoin(`${usersActivityReferral} AS r`, function () {
        this.on('r.referral_user_id', '=', `${TABLE_NAME}.id`)
          .andOn('r.source_entity_id', '=', userId)
          .andOn('r.entity_name', '=', knex.raw(`'${UsersModelProvider.getEntityName()}'`));
      });

    this.addListParamsToQueryBuilder(queryBuilder, params);

    return queryBuilder;
  }

  /**
   *
   * @param {Object} queryParameters
   * @returns {Promise}
   */
  static async findAllForList(queryParameters) {
    const params = _.defaults(queryParameters, this.getDefaultListParams());
    params.attributes = this.getModel().getFieldsForPreview();

    return model.findAll(params);
  }

  /**
   *
   * @param {string} tagTitle
   * @param {Object} givenParams
   * @returns {Promise<Knex.QueryBuilder>}
   */
  static async findAllByTagTitle(tagTitle, givenParams) {
    const params = _.defaults(givenParams, this.getDefaultListParams());

    params.attributes = this.getModel().getFieldsForPreview();
    params.main_table_alias = 't';
    const tagsJoinColumn = 'user_id';

    const queryBuilder = taggableRepository.findAllByTagTitle(
      TABLE_NAME,
      tagTitle,
      tagsJoinColumn,
      params,
      UsersRepository.getPropsFields(),
    );

    this.innerJoinUosAccountsProperties(queryBuilder, params.main_table_alias);
    this.innerJoinUsersCurrentParams(queryBuilder, params.main_table_alias);

    const data = await queryBuilder;

    RepositoryHelper.convertStringFieldsToNumbersForArray(data, this.getPropsFields());

    return data;
  }

  /**
   *
   * @param {string} tagTitle
   * @returns {Promise<Knex.QueryBuilder>}
   */
  static async countAllByTagTitle(tagTitle) {
    const tagsJoinColumn = 'user_id';

    return taggableRepository.countAllByTagTitle(TABLE_NAME, tagTitle, tagsJoinColumn);
  }

  /**
   *
   * @returns {{}}
   */
  static getOrderByRelationMap() {
    return {};
  }

  /**
   *
   * @returns {string[]}
   */
  static getAllowedOrderBy() {
    return [
      'id',
      'current_rate',
      'created_at',
      'account_name',
      'score',
      'external_login',

      'scaled_social_rate',
      'scaled_importance',

      'posts_total_amount_delta',
      'scaled_importance_delta',
      'scaled_social_rate_delta',
    ];
  }

  public static getWhereProcessor(): Function {
    return (query, params) => {
      params.where = {};

      // @deprecated this is a sequelize method
      if (query.user_name) {
        params.where = this.getSearchUserQueryWhere(query.user_name);
      }

      if (EntityListCategoryDictionary.isTrending(query.overview_type)) {
        params.whereRaw = this.whereRawTrending();
      }
    };
  }

  public static addWhereToQueryBuilderByQuery(query: RequestQueryDto, queryBuilder: QueryBuilder) {
    this.addSearchToQueryBuilder(query, queryBuilder);
  }

  public static async countAll(params): Promise<number> {
    const where = params ? params.where : {};

    return UsersRepository.getModel().count({
      where,
    });
  }

  /**
   * @param {boolean} isRaw
   * @return {Promise<*>}
   */
  static async findAll(isRaw = false) {
    const attributes = this.getModel().getFieldsForPreview();
    const modelResult = await models.Users.findAll({
      attributes,
      order: [
        ['current_rate', 'DESC'],
      ],
    });

    if (isRaw) {
      return modelResult.map(data => data.toJSON());
    }

    return modelResult;
  }

  static async getUserByAccountName(accountName) {
    return models.Users.findOne({
      where: {
        account_name: accountName,
      },
      include: [{
        model: models.users_education,
        as: 'users_education',
      }, {
        model: models.users_jobs,
        as: 'users_jobs',
      }, {
        model: models.users_sources,
        as: 'users_sources',
      }],
      order: [
        ['users_education', 'id', 'ASC'],
        ['users_jobs', 'id', 'ASC'],
        ['users_sources', 'source_type_id', 'ASC'],
      ],
    });
  }

  static async findAllWithRates() {
    const rows = await models.Users.findAll({
      where: {
        current_rate: {
          [Op.gt]: 0,
        },
      },
      order: [
        ['current_rate', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return rows.map(row => row.toJSON());
  }

  public static getDefaultListParams() {
    return {
      where: {},
      offset: 0,
      limit: 200,
      order: this.getDefaultOrderBy(),
      raw: true,
    };
  }

  static getDefaultOrderBy() {
    return [
      ['current_rate', 'DESC'],
      ['id', 'DESC'],
    ];
  }

  /**
   *
   * @return {string}
   */
  static getUsersModelName() {
    return TABLE_NAME;
  }

  static getModel() {
    return models.Users;
  }

  public static getPropsFields(): string[] {
    return UsersModelProvider.getPropsFields();
  }

  /**
   * @deprecated - consider to get rid of sequelize, use knex + objection.js
   * @param query
   */
  private static getSearchUserQueryWhere(query: string) {
    return {
      [Op.or]: {
        account_name: {
          [Op.iLike]: `%${query}%`,
        },
        first_name: {
          [Op.iLike]: `%${query}%`,
        },
        last_name: {
          [Op.iLike]: `%${query}%`,
        },
      },
    };
  }

  private static whereRawTrending(): string {
    const lowerLimit = EnvHelper.isStagingEnv() ? (-100) : 0;
    const tableName = UsersModelProvider.getCurrentParamsTableName();

    return `${tableName}.scaled_social_rate_delta > ${lowerLimit} AND ${tableName}.posts_total_amount_delta > ${lowerLimit}`;
  }

  public static innerJoinUsersCurrentParams(queryBuilder: QueryBuilder, alias: string | null = null): void {
    const currentTableName = alias || TABLE_NAME;
    queryBuilder
      .innerJoin(
        UsersModelProvider.getCurrentParamsTableName(),
        `${UsersModelProvider.getCurrentParamsTableName()}.user_id`,
        `${currentTableName}.id`,
      );
  }

  public static innerJoinUosAccountsProperties(queryBuilder: QueryBuilder, alias: string | null = null): void {
    const currentTableName = alias || TABLE_NAME;

    // eslint-disable-next-line func-names
    queryBuilder.innerJoin(UosAccountsModelProvider.uosAccountsPropertiesTableName(), function () {
      this.on(`${UosAccountsModelProvider.uosAccountsPropertiesTableName()}.entity_id`, '=', `${currentTableName}.id`)
        .andOn(
          `${UosAccountsModelProvider.uosAccountsPropertiesTableName()}.entity_name`,
          '=',
          knex.raw(`'${UsersModelProvider.getEntityName()}'`),
        );
    });
  }

  public static async findAllWhoTrustsUser(
    userId: number,
    params: DbParamsDto,
  ) {
    const activityTableName = UsersModelProvider.getUsersActivityTrustTableName();

    return this.findAllWhoActsForUser(userId, params, activityTableName);
  }

  private static findAllWhoActsForUser(userId: number, params: DbParamsDto, tableName: string): QueryBuilder {
    UsersRepository.checkIsAllowedActivityTable(tableName);

    const queryBuilder = knex(TABLE_NAME)
      .where({
        [`${tableName}.entity_id`]: userId,
      })
      // eslint-disable-next-line func-names
      .innerJoin(tableName, function () {
        this.on(`${tableName}.user_id`, `${TABLE_NAME}.id`)
          .andOn(`${tableName}.entity_name`, knex.raw(`'${UsersModelProvider.getEntityName()}'`));
      });

    UsersRepository.addListParamsToQueryBuilder(queryBuilder, params);

    return queryBuilder;
  }

  private static findAllWhoActsForOrganization(
    organizationId: number,
    params: DbParamsDto,
    tableName: string,
  ): QueryBuilder {
    UsersRepository.checkIsAllowedActivityTable(tableName);

    const queryBuilder = knex(TABLE_NAME)
      .where({
        [`${tableName}.entity_id`]: organizationId,
      })
      // eslint-disable-next-line func-names
      .innerJoin(tableName, function () {
        this.on(`${tableName}.user_id`, `${TABLE_NAME}.id`)
          .andOn(`${tableName}.entity_name`, knex.raw(`'${OrganizationsModelProvider.getEntityName()}'`));
      });

    UsersRepository.addListParamsToQueryBuilder(queryBuilder, params);

    return queryBuilder;
  }

  private static findMyActivityForOtherUsers(userId: number, params: DbParamsDto, tableName: string): QueryBuilder {
    this.checkIsAllowedActivityTable(tableName);

    const queryBuilder = knex(TABLE_NAME)
      .where(`${tableName}.user_id`, userId)
      // eslint-disable-next-line func-names
      .innerJoin(tableName, function () {
        this.on(`${tableName}.entity_id`, `${TABLE_NAME}.id`)
          .andOn(`${tableName}.entity_name`, knex.raw(`'${UsersModelProvider.getEntityName()}'`));
      });

    this.addListParamsToQueryBuilder(queryBuilder, params);

    return queryBuilder;
  }

  private static addListSelectAttributes(params: DbParamsDto): void {
    params.attributes = [];
    QueryFilterService.addExtraAttributes(params, UsersModelProvider.getUserFieldsForPreview(), TABLE_NAME);
    QueryFilterService.addExtraAttributes(params, UsersRepository.getPropsFields());
  }

  private static addListParamsToQueryBuilder(queryBuilder: QueryBuilder, params: DbParamsDto): void {
    UsersRepository.addListSelectAttributes(params);
    QueryFilterService.addParamsToKnexQuery(queryBuilder, params);

    UsersRepository.innerJoinUosAccountsProperties(queryBuilder);
    UsersRepository.innerJoinUsersCurrentParams(queryBuilder);
  }

  private static checkIsAllowedActivityTable(tableName: string): void {
    const set: string[] = [
      UsersModelProvider.getUsersActivityFollowTableName(),
      UsersModelProvider.getUsersActivityTrustTableName(),
      UsersModelProvider.getUsersActivityVoteTableName(),
    ];

    if (!set.includes(tableName)) {
      throw new AppError(`Unsupported tableName: ${tableName}`);
    }
  }

  private static getQueryBuilderFilteredByRequestQuery(query: RequestQueryDto) {
    const queryBuilder = knex(TABLE_NAME);

    this.addSearchToQueryBuilder(query, queryBuilder);

    return queryBuilder;
  }

  private static addSearchToQueryBuilder(query: UsersRequestQueryDto, queryBuilder: QueryBuilder) {
    if (!query.users_identity_pattern) {
      return;
    }

    // eslint-disable-next-line func-names
    queryBuilder.andWhere(function () {
      this.where(`${TABLE_NAME}.account_name`,  'ilike', `%${query.users_identity_pattern}%`)
        .orWhere(`${TABLE_NAME}.first_name`,    'ilike', `%${query.users_identity_pattern}%`)
        .orWhere(`${TABLE_NAME}.last_name`,     'ilike', `%${query.users_identity_pattern}%`);
    });
  }
}

export = UsersRepository;
