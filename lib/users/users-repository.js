"use strict";
const errors_1 = require("../api/errors");
const knex = require("../../config/knex");
const PostsModelProvider = require("../posts/service/posts-model-provider");
const PostsRepository = require("../posts/posts-repository");
const UsersModelProvider = require("./users-model-provider");
const RepositoryHelper = require("../common/repository/repository-helper");
const UsersExternalModelProvider = require("../users-external/service/users-external-model-provider");
const AirdropsModelProvider = require("../airdrops/service/airdrops-model-provider");
const ExternalTypeIdDictionary = require("../users-external/dictionary/external-type-id-dictionary");
const UosAccountsModelProvider = require("../uos-accounts-properties/service/uos-accounts-model-provider");
const AirdropsUsersRepository = require("../airdrops/repository/airdrops-users-repository");
const EntityListCategoryDictionary = require("../stats/dictionary/entity-list-category-dictionary");
const EnvHelper = require("../common/helper/env-helper");
const QueryFilterService = require("../api/filters/query-filter-service");
const KnexQueryBuilderHelper = require("../common/helper/repository/knex-query-builder-helper");
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
    static async findAllAirdropParticipants(airdropId, params) {
        const previewFields = UsersModelProvider.getUserFieldsForPreview();
        const toSelect = RepositoryHelper.getPrefixedAttributes(previewFields, TABLE_NAME);
        toSelect.push(`${airdropsUsersExternalData}.score AS score`);
        toSelect.push(`${usersExternal}.external_login AS external_login`);
        return knex(TABLE_NAME)
            .select(toSelect)
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
            .orderByRaw(params.orderByRaw)
            .limit(params.limit)
            .offset(params.offset);
    }
    static async findManyAsRelatedToEntity(params, statsFieldName, relEntityField, overviewType, entityName) {
        if (entityName !== PostsModelProvider.getEntityName()) {
            throw new errors_1.AppError(`Unsupported entity: ${entityName}`, 500);
        }
        const relEntityNotNull = false;
        const { postSubQuery, extraFieldsToSelect } = PostsRepository.prepareRelatedEntitySqlParts(overviewType, params, statsFieldName, relEntityField, relEntityNotNull);
        const sql = `
      select "Users"."id"               as "id",
             "Users"."account_name"     as "account_name",
             "Users"."first_name"       as "first_name",
             "Users"."last_name"        as "last_name",
             "Users"."nickname"         as "nickname",
             "Users"."avatar_filename"  as "avatar_filename",
             "Users"."current_rate"     as "current_rate"
             ${extraFieldsToSelect}
      from "Users" INNER JOIN
            ${postSubQuery}
           ON t.${relEntityField} = "Users".id
      ORDER BY t.${statsFieldName} DESC
    `;
        const data = await knex.raw(sql);
        return data.rows;
    }
    static async countManyUsersAsRelatedToEntity(params, statsFieldName, relatedEntityField, overviewType) {
        const relEntityNotNull = false;
        const subQuery = PostsRepository.prepareSubQueryForCounting(overviewType, relatedEntityField, statsFieldName, params, relEntityNotNull);
        const sql = `
    SELECT COUNT(1) as amount FROM
      (
        ${subQuery}
      ) AS t
    `;
        const res = await knex.raw(sql);
        return +res.rows[0].amount;
    }
    static async findUserIdsByAccountNames(accountNames, key = 'account_name', value = 'id') {
        const data = await knex(TABLE_NAME)
            .select(['id', 'account_name'])
            .whereIn('account_name', accountNames);
        const result = {};
        data.forEach((user) => {
            result[user[key]] = user[value];
        });
        return result;
    }
    static async findUserIdsByObjectIndexedByAccountNames(indexedObject, key = 'account_name', value = 'id') {
        return this.findUserIdsByAccountNames(Object.keys(indexedObject), key, value);
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
        const opOrConditions = [];
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
        // const followerAttributes = this.getModel().getFieldsForPreview();
        // Get user himself
        // Get user following data with related users
        const include = [
            {
                model: models[UosAccountsModelProvider.uosAccountsPropertiesTableNameWithoutSchema()],
                attributes: UosAccountsModelProvider.getFieldsToSelect(),
                required: false,
                as: 'uos_accounts_properties',
            },
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
    static async findByNameFields(query) {
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
    static async findManyUsersByIdForCard(ids) {
        // noinspection TypeScriptValidateJSTypes
        const data = await this.getModel().findAll({
            attributes: this.getModel().getFieldsForPreview(),
            where: {
                id: {
                    [Op.in]: ids,
                },
            },
            raw: true,
        });
        const res = {};
        data.forEach((item) => {
            // @ts-ignore
            res[item.id] = item;
        });
        return res;
    }
    static async findOneByIdForPreview(id) {
        return this.getModel().findOne({
            attributes: this.getModel().getFieldsForPreview(),
            where: { id },
            raw: true,
        });
    }
    static async findOneByIdAsObject(userId) {
        return this.getModel().findOne({
            where: {
                id: userId,
            },
            raw: true,
        });
    }
    static async findOneByAccountNameAsObject(accountName) {
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
    static async doesUserExistWithId(id) {
        const count = await this.getModel().count({
            where: {
                id,
            },
        });
        return !!count;
    }
    static async doesUserExistWithAccountName(accountName) {
        const count = await this.getModel().count({
            where: {
                account_name: accountName,
            },
        });
        return !!count;
    }
    static async findAllWhoTrustsUser(userId, params) {
        const previewFields = UsersModelProvider.getUserFieldsForPreview();
        const toSelect = RepositoryHelper.getPrefixedAttributes(previewFields, TABLE_NAME);
        const usersActivityTrust = UsersModelProvider.getUsersActivityTrustTableName();
        return knex(TABLE_NAME)
            .select(toSelect)
            .where({
            [`${usersActivityTrust}.entity_id`]: userId,
            [`${usersActivityTrust}.entity_name`]: UsersModelProvider.getEntityName(),
        })
            .innerJoin(`${usersActivityTrust}`, `${usersActivityTrust}.user_id`, `${TABLE_NAME}.id`)
            .orderByRaw(params.orderByRaw)
            .limit(params.limit)
            .offset(params.offset);
    }
    static findManyForListViaKnex(params) {
        const queryBuilder = knex(TABLE_NAME);
        params.attributes = UsersModelProvider.getUserFieldsForPreview();
        const extraAttributes = UosAccountsModelProvider.getFieldsToSelect().concat(UsersModelProvider.getCurrentParamsToSelect());
        QueryFilterService.processAttributes(params, TABLE_NAME, true);
        QueryFilterService.addExtraAttributes(params, extraAttributes);
        QueryFilterService.addParamsToKnexQuery(queryBuilder, params);
        this.innerJoinUosAccountsProperties(queryBuilder);
        this.innerJoinUsersCurrentParams(queryBuilder);
        return queryBuilder;
    }
    static async countManyForListViaKnex(params) {
        const queryBuilder = knex(TABLE_NAME);
        QueryFilterService.addWhereRawParamToKnexQuery(queryBuilder, params);
        this.innerJoinUsersCurrentParams(queryBuilder);
        return KnexQueryBuilderHelper.addCountToQueryBuilderAndCalculate(queryBuilder, TABLE_NAME);
    }
    static async findUserReferrals(userId, params) {
        const previewFields = UsersModelProvider.getUserFieldsForPreview();
        const toSelect = RepositoryHelper.getPrefixedAttributes(previewFields, TABLE_NAME);
        const usersActivityReferral = UsersModelProvider.getUsersActivityReferralTableName();
        return knex(TABLE_NAME)
            .select(toSelect)
            // eslint-disable-next-line func-names
            .innerJoin(`${usersActivityReferral} AS r`, function () {
            this.on('r.referral_user_id', '=', `${TABLE_NAME}.id`)
                .andOn('r.source_entity_id', '=', userId)
                .andOn('r.entity_name', '=', knex.raw(`'${UsersModelProvider.getEntityName()}'`));
        })
            .orderByRaw(params.orderByRaw)
            .limit(params.limit)
            .offset(params.offset);
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
        return taggableRepository.findAllByTagTitle(TABLE_NAME, tagTitle, tagsJoinColumn, params);
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
        ];
    }
    static getWhereProcessor() {
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
    static async countAll(params) {
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
    static getDefaultListParams() {
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
    /**
     * @deprecated - consider to get rid of sequelize, use knex + objection.js
     * @param query
     */
    static getSearchUserQueryWhere(query) {
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
    static whereRawTrending() {
        const lowerLimit = EnvHelper.isStagingEnv() ? (-100) : 0;
        const tableName = UsersModelProvider.getCurrentParamsTableName();
        return `${tableName}.scaled_importance_delta > ${lowerLimit} AND ${tableName}.posts_total_amount_delta > ${lowerLimit}`;
    }
    static innerJoinUsersCurrentParams(queryBuilder) {
        queryBuilder
            .innerJoin(UsersModelProvider.getCurrentParamsTableName(), `${UsersModelProvider.getCurrentParamsTableName()}.user_id`, `${TABLE_NAME}.id`);
    }
    static innerJoinUosAccountsProperties(queryBuilder) {
        // eslint-disable-next-line func-names
        queryBuilder.innerJoin(UosAccountsModelProvider.uosAccountsPropertiesTableName(), function () {
            this.on(`${UosAccountsModelProvider.uosAccountsPropertiesTableName()}.entity_id`, '=', `${TABLE_NAME}.id`)
                .andOn(`${UosAccountsModelProvider.uosAccountsPropertiesTableName()}.entity_name`, '=', knex.raw(`'${UsersModelProvider.getEntityName()}'`));
        });
    }
}
module.exports = UsersRepository;
