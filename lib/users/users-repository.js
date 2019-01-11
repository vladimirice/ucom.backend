"use strict";
const models = require('../../models');
const userModelProvider = require('./users-model-provider');
const Op = models.sequelize.Op;
const db = models.sequelize;
const _ = require('lodash');
const model = userModelProvider.getUsersModel();
const TABLE_NAME = 'Users';
const taggableRepository = require('../common/repository/taggable-repository');
class UsersRepository {
    /**
     *
     * @param {string[]} accountNames
     * @return {Promise<Object>}
     */
    static async findUserIdsByAccountNames(accountNames) {
        const data = await model.findAll({
            attributes: ['id', 'account_name'],
            where: {
                account_name: {
                    [Op.in]: accountNames,
                },
            },
            raw: true,
        });
        const result = {};
        data.forEach((user) => {
            result[user.account_name] = user.id;
        });
        return result;
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
        const attributes = _.concat(Object.keys(fieldsValues), ['id']);
        return await model.findAll({
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
        return result ? result['account_name'] : null;
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
        return await models.Users.findOne({
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
        return await userModelProvider.getUsersModel().findOne({
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
        // noinspection JSUnusedGlobalSymbols
        return await this.getModel().findAll({
            attributes: this.getModel().getFieldsForPreview(),
            where: {
                $or: {
                    first_name: {
                        $like: `%${query}%`,
                    },
                    last_name: {
                        $like: `%${query}%`,
                    },
                    account_name: {
                        $like: `%${query}%`,
                    },
                    nickname: {
                        $like: `%${query}%`,
                    },
                },
            },
            raw: true,
        });
    }
    static async findOneById(userId) {
        return await this.getModel().findOne({
            where: {
                id: userId,
            },
        });
    }
    static async findOneByIdAsObject(userId) {
        return await this.getModel().findOne({
            where: {
                id: userId,
            },
            raw: true,
        });
    }
    static async findOneByAccountNameAsObject(accountName) {
        return await this.getModel().findOne({
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
    /**
     *
     * @param {Object} queryParameters
     * @returns {Promise}
     */
    static async findAllForList(queryParameters) {
        const params = _.defaults(queryParameters, this.getDefaultListParams());
        params.attributes = this.getModel().getFieldsForPreview();
        return await model.findAll(params);
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
        ];
    }
    /**
     *
     * @returns {Function}
     */
    static getWhereProcessor() {
        // @ts-ignore
        return function (query, params) {
            params.where = {};
        };
    }
    /**
     *
     * @param {Object} params
     * @returns {Promise<*>}
     */
    static async countAll(params) {
        const where = params ? params.where : {};
        return await UsersRepository.getModel().count({
            where,
        });
    }
    /**
     * @deprecated
     * @param {boolean} isRaw
     * @return {Promise<*>}
     */
    static async findAll(isRaw = false) {
        const attributes = this.getModel().getFieldsForPreview();
        const modelResult = await models['Users'].findAll({
            attributes,
            order: [
                ['current_rate', 'DESC'],
            ],
        });
        if (isRaw) {
            return modelResult.map((data) => {
                return data.toJSON();
            });
        }
        return modelResult;
    }
    static async getUserByAccountName(accountName) {
        return await models['Users'].findOne({
            where: {
                account_name: accountName,
            },
            include: [{
                    model: models['users_education'],
                    as: 'users_education',
                }, {
                    model: models['users_jobs'],
                    as: 'users_jobs',
                }, {
                    model: models['users_sources'],
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
        const rows = await models['Users'].findAll({
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
        return rows.map((row) => {
            return row.toJSON();
        });
    }
    /**
     *
     * @returns {Object}
     * @private
     */
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
        return models['Users'];
    }
}
module.exports = UsersRepository;
