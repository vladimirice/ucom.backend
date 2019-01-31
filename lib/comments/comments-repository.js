"use strict";
const _ = require('lodash');
const models = require('../../models');
const db = models.sequelize;
const { Op } = db;
const orgModelProvider = require('../organizations/service').ModelProvider;
const commentsModelProvider = require('./service').ModelProvider;
const usersModelProvider = require('../users/service').ModelProvider;
const userPreviewAttributes = usersModelProvider.getUserFieldsForPreview();
const model = commentsModelProvider.getModel();
class CommentsRepository {
    /**
     *
     * @return {Object[]}
     */
    static getCommentIncludedModels() {
        return [
            {
                model: usersModelProvider.getUsersModel(),
                attributes: userPreviewAttributes,
                as: 'User',
            },
            {
                model: this.getActivityUserCommentModel(),
                as: this.getActivityUserCommentModelName(),
                required: false,
            },
            orgModelProvider.getIncludeForPreview(),
        ];
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<string|null>}
     */
    static async findBlockchainIdById(id) {
        const result = await this.getModel().findOne({
            attributes: ['blockchain_id'],
            where: { id },
            raw: true,
        });
        return result ? result.blockchain_id : null;
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<*>}
     */
    static async incrementCurrentVoteCounter(id) {
        return this.getModel().update({
            current_vote: db.literal('current_vote + 1'),
        }, {
            where: {
                id,
            },
        });
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<*>}
     */
    static async decrementCurrentVoteCounter(id) {
        return this.getModel().update({
            current_vote: db.literal('current_vote - 1'),
        }, {
            where: {
                id,
            },
        });
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<number>}
     */
    static async getCommentCurrentVote(id) {
        const result = await this.getModel().findOne({
            attributes: ['current_vote'],
            where: {
                id,
            },
            raw: true,
        });
        return result ? +result.current_vote : null;
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<void>}
     */
    static async findOneById(id) {
        const attributes = model.getFieldsForPreview();
        const where = {
            id,
        };
        const include = this.getCommentIncludedModels();
        const res = await this.getModel().findOne({
            attributes,
            where,
            include,
        });
        return res.toJSON();
    }
    static async countAllByParentIdAndDepth(parentId, depth) {
        const where = {
            depth,
            parent_id: parentId,
        };
        return model.count({ where });
    }
    static async countNextDepthTotalAmounts(commentableIds, depth) {
        if (commentableIds.length === 0) {
            return {};
        }
        const sql = `
    SELECT parent_id, COUNT(1) as amount FROM comments
    WHERE
      depth = ${+depth} -- next depth level
      AND parent_id IS NOT NULL -- for reference, for depth >= 1 parent_id must always be NOT NULL
      AND commentable_id IN (${commentableIds.join(', ')})
    GROUP BY parent_id;
    `;
        const data = await db.query(sql, { type: db.QueryTypes.SELECT });
        const res = {};
        data.forEach((item) => {
            res[item.parent_id] = +item.amount;
        });
        return res;
    }
    static async countAllByCommentableId(commentableId, params) {
        params.where.commentable_id = commentableId;
        return model.count({ where: params.where });
    }
    static async countAllByCommentableIdsAndDepth(commentableIds, params) {
        const where = Object.assign({}, params.where, { commentable_id: {
                [Op.in]: commentableIds,
            } });
        // #task IDE collision
        // noinspection TypeScriptValidateJSTypes
        const data = await model.findAll({
            where,
            raw: true,
            group: ['commentable_id'],
            attributes: [
                'commentable_id',
                [db.fn('COUNT', 'id'), 'comments_amount'],
            ],
        });
        const res = {};
        data.forEach((item) => {
            res[item.commentable_id] = +item.comments_amount;
        });
        return res;
    }
    static async countAllByDbParamsDto(params) {
        return model.count({ where: params.where });
    }
    // #task - it is supposed that commentable ID is always Post
    static async findAllByCommentableId(commentableId, queryParameters) {
        // #task - move to separateQueryService
        const params = _.defaults(queryParameters, this.getDefaultListParams());
        params.where.commentable_id = commentableId;
        // #task - exclude user related activity to separate request, as for posts
        params.include = this.getCommentIncludedModels();
        const result = await model.findAll(params);
        return result.map(data => data.toJSON());
    }
    // #task - it is supposed that commentable ID is always Post
    static async findAllByManyCommentableIds(commentableIds, queryParameters) {
        // #task - move to separateQueryService
        const params = _.defaults(queryParameters, this.getDefaultListParams());
        params.where.commentable_id = {
            [Op.in]: commentableIds,
        };
        // #task - exclude user related activity to separate request, as for posts
        params.include = this.getCommentIncludedModels();
        const data = await model.findAll(params);
        const res = {};
        data.forEach((row) => {
            const jsonRow = row.toJSON();
            const commentableId = jsonRow.commentable_id;
            if (res[commentableId]) {
                res[commentableId].push(jsonRow);
            }
            else {
                res[commentableId] = [jsonRow];
            }
        });
        return res;
    }
    static async findAllByDbParamsDto(queryParameters) {
        // #task - move to separateQueryService
        const params = _.defaults(queryParameters, this.getDefaultListParams());
        // #task - exclude user related activity to separate request, as for posts
        params.include = this.getCommentIncludedModels();
        const result = await model.findAll(params);
        return result.map(data => data.toJSON());
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {number} id - comment ID
     * @returns {Promise<string|null>}
     */
    static async getPathById(id) {
        const result = await this.getModel().findOne({
            attributes: [
                'path',
            ],
            where: {
                id,
            },
            raw: true,
        });
        return result ? result.path : null;
    }
    /**
     *
     * @param {Object} data
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    static async createNew(data, transaction) {
        return this.getModel().create(data, transaction);
    }
    static getModel() {
        return models.comments;
    }
    /**
     *
     * @returns {Object}
     */
    static getActivityUserCommentModel() {
        return models[this.getActivityUserCommentModelName()];
    }
    /**
     * @param {number} userId
     */
    static async findLastCommentByAuthor(userId) {
        const result = await this.getModel().findOne({
            where: {
                user_id: userId,
            },
            order: [
                ['id', 'DESC'],
            ],
            raw: true,
        });
        if (result) {
            result.path = JSON.parse(result.path);
        }
        return result;
    }
    /**
     *
     * @returns {string}
     */
    static getActivityUserCommentModelName() {
        return 'activity_user_comment';
    }
    /**
     *
     * @returns {Function}
     */
    static getWhereProcessor() {
        return (query, params) => {
            if (!params.where) {
                params.where = {};
            }
            if (query === null) {
                return;
            }
            const allowedInt = [
                'depth',
                'parent_id',
                'commentable_id',
            ];
            allowedInt.forEach((item) => {
                if (query[item] !== undefined) {
                    params.where[item] = +query[item];
                }
            });
        };
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @returns {Object}
     */
    static getOrderByRelationMap() {
        return {};
    }
    // noinspection JSUnusedGlobalSymbols
    static getAllowedOrderBy() {
        return [];
    }
    static getDefaultOrderBy() {
        return [
            ['id', 'ASC'],
        ];
    }
    static getDefaultListParams() {
        return {
            attributes: model.getFieldsForPreview(),
            where: {},
            offset: 0,
            limit: 10,
            order: this.getDefaultOrderBy(),
        };
    }
}
module.exports = CommentsRepository;
