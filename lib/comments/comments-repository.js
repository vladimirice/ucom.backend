"use strict";
const models = require('../../models');
const db = models.sequelize;
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
        return await this.getModel().update({
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
        return await this.getModel().update({
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
        return result ? +result['current_vote'] : null;
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
    /**
     *
     * @param {number} commentableId
     * @return {Promise<any[]>}
     */
    static async findAllByCommentableId(commentableId) {
        // #task - it is supposed that commentable ID is aways posts
        const attributes = model.getFieldsForPreview();
        const where = {
            commentable_id: commentableId,
        };
        // #task - exclude user related activity to separate request, as for posts
        const include = this.getCommentIncludedModels();
        const result = await model.findAll({
            attributes,
            where,
            include,
        });
        return result.map((data) => {
            return data.toJSON();
        });
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
        return result ? result['path'] : null;
    }
    /**
     *
     * @param {Object} data
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    static async createNew(data, transaction) {
        return await this.getModel().create(data, transaction);
    }
    static getModel() {
        return models['comments'];
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
}
module.exports = CommentsRepository;
