"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const models = require('../../models');
const moment = require('moment');
const ENTITY_STATS_CURRENT_TABLE_NAME = 'entity_stats_current';
const entityStatsCurrentModel = models[ENTITY_STATS_CURRENT_TABLE_NAME];
const db = models.sequelize;
const Op = db.Op;
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const orgModelProvider = require('../organizations/service').ModelProvider;
const postsModelProvider = require('./service').ModelProvider;
const usersModelProvider = require('../users/service').ModelProvider;
const POST_TYPE__MEDIA_POST = ContentTypeDictionary.getTypeMediaPost();
const userPreviewAttributes = usersModelProvider.getUserFieldsForPreview();
const postStatsRepository = require('./stats/post-stats-repository');
const commentsRepository = require('../comments/comments-repository');
const TABLE_NAME = 'posts';
const model = postsModelProvider.getModel();
const _ = require('lodash');
const knex = require('../../config/knex');
class PostsRepository {
    /**
     *
     * @param {number} id
     * @param {Object} entityTags
     * @param {Transaction} trx
     * @returns {Promise<void>}
     */
    static updatePostEntityTagsById(id, entityTags, trx) {
        return __awaiter(this, void 0, void 0, function* () {
            // noinspection JSCheckFunctionSignatures
            return yield trx(postsModelProvider.getTableName())
                .update({ entity_tags: entityTags })
                .where('id', '=', id)
                .returning('*');
        });
    }
    /**
     *
     * @param {string[]} blockchainIds
     * @return {Promise<Object>}
     */
    static findIdsByBlockchainIds(blockchainIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getModel().findAll({
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
        });
    }
    /**
     *
     * @returns {Function}
     */
    static getWhereProcessor() {
        return function (query, params) {
            if (query.post_type_id) {
                params.where.post_type_id = +query.post_type_id;
            }
            if (query.created_at && query.created_at === '24_hours') {
                const newData = moment().subtract(24, 'hours');
                params.where.created_at = {
                    [Op.gte]: newData.format('YYYY-MM-DD HH:mm:ss'),
                };
            }
            if (query.sort_by && query.sort_by.includes('current_rate_delta_daily')) {
                params.where.importance_delta =
                    db.where(db.col(`${ENTITY_STATS_CURRENT_TABLE_NAME}.importance_delta`), {
                        [Op.gt]: 0,
                    });
            }
        };
    }
    /**
     *
     * @returns {Object}
     */
    static getOrderByRelationMap() {
        return {
            comments_count: [
                postsModelProvider.getPostStatsModel(),
                'comments_count',
            ],
            current_rate_delta_daily: [
                entityStatsCurrentModel,
                'importance_delta',
            ],
        };
    }
    /**
     *
     * @return {string[]}
     */
    static getAllowedOrderBy() {
        return [
            'current_rate',
            'id',
            'title',
            'comments_count',
            'current_vote',
            'created_at',
            'current_rate_delta_daily',
        ];
    }
    /**
     *
     * @param {number} id
     * @return {Promise<boolean>}
     */
    static isForOrganization(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                id,
                organization_id: {
                    [Op.ne]: null,
                },
            };
            const res = yield model.count({
                where,
            });
            return !!res;
        });
    }
    static incrementCurrentVoteCounter(id, by = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getModel().increment('current_vote', {
                by,
                where: {
                    id,
                },
            });
        });
    }
    /**
     *
     * @param {number} id
     * @param {number} by
     * @returns {Promise<*>}
     */
    static decrementCurrentVoteCounter(id, by = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getModel().decrement('current_vote', {
                by,
                where: {
                    id,
                },
            });
        });
    }
    static findLastByAuthor(userId, isRaw = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getModel().findOne({
                where: {
                    user_id: userId,
                    post_type_id: POST_TYPE__MEDIA_POST,
                },
                order: [
                    ['id', 'DESC'],
                ],
                limit: 1,
            });
            return isRaw ? data.toJSON() : data;
        });
    }
    static findFirstMediaPostIdUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getModel().findOne({
                attributes: ['id'],
                where: {
                    user_id: userId,
                    post_type_id: POST_TYPE__MEDIA_POST,
                },
                order: [
                    ['id', 'DESC'],
                ],
                limit: 1,
                raw: true,
            });
            return data ? data.id : null;
        });
    }
    /**
     *
     * @param {number} userId
     * @return {Promise<number|null>}
     */
    static findLastMediaPostIdUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getModel().findOne({
                attributes: ['id'],
                where: {
                    user_id: userId,
                    post_type_id: POST_TYPE__MEDIA_POST,
                },
                order: [
                    ['id', 'ASC'],
                ],
                limit: 1,
                raw: true,
            });
            return data ? data.id : null;
        });
    }
    static findLast(isRaw = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getModel().findOne({
                where: {
                    post_type_id: POST_TYPE__MEDIA_POST,
                },
                order: [
                    ['id', 'DESC'],
                ],
                limit: 1,
            });
            return isRaw ? data.toJSON() : data;
        });
    }
    /**
     *
     * @param {boolean} raw
     * @returns {Promise<Object>}
     */
    static findAllMediaPosts(raw = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getModel().findAll({
                raw,
                where: {
                    post_type_id: POST_TYPE__MEDIA_POST,
                },
            });
        });
    }
    /**
     *
     * @param {Object | null} queryParameters
     * @returns {Promise<number>}
     */
    static countAllPosts(queryParameters = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const include = [
                {
                    attributes: [],
                    model: entityStatsCurrentModel,
                    required: false,
                },
            ];
            const where = queryParameters !== null ? queryParameters['where'] : {};
            return yield PostsRepository.getModel().count({
                where,
                include,
            });
        });
    }
    /**
     *
     * @param {string} field
     * @returns {Promise<Object>}
     */
    static findMinPostIdByParameter(field) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = [];
            order[0] = [field, 'ASC'];
            order[1] = ['id', 'DESC'];
            const result = yield PostsRepository.getModel().findOne({
                order,
                attributes: [
                    'id',
                ],
                limit: 1,
                raw: true,
            });
            return result ? result['id'] : null;
        });
    }
    /**
     *
     * @param {string} field
     * @returns {Promise<Object>}
     */
    static findMaxPostIdByParameter(field) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = [];
            order[0] = [field, 'DESC'];
            order[1] = ['id', 'DESC'];
            const result = yield PostsRepository.getModel().findOne({
                order,
                attributes: [
                    'id',
                ],
                limit: 1,
                raw: true,
            });
            return result ? result['id'] : null;
        });
    }
    /**
     *
     * @param {Object|null} queryParameters
     * @return {Promise<any[]>}
     */
    static findAllPosts(queryParameters = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const attributes = this.getModel().getFieldsForPreview();
            const params = _.defaults(queryParameters, this.getDefaultListParams());
            const include = [
                orgModelProvider.getIncludeForPreview(),
                usersModelProvider.getIncludeAuthorForPreview(),
                postsModelProvider.getPostsStatsInclude(),
                postsModelProvider.getPostOfferItselfInclude(),
                {
                    attributes: ['upvote_delta', 'importance_delta'],
                    model: entityStatsCurrentModel,
                    required: false,
                },
            ];
            const models = yield postsModelProvider.getModel().findAll(Object.assign({ attributes,
                include }, params));
            return models.map((model) => {
                return model.toJSON();
            });
        });
    }
    // noinspection JSUnusedGlobalSymbols
    static findOneForIpfs(id, postTypeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const postOfferAttributes = models['post_offer'].getPostOfferAttributesForIpfs();
            const include = [
                {
                    attributes: ['account_name'],
                    model: models['Users'],
                },
            ];
            if (postTypeId === ContentTypeDictionary.getTypeOffer()) {
                include.push({
                    attributes: postOfferAttributes,
                    model: models['post_offer'],
                });
            }
            const postAttributes = this.getModel().getMediaPostAttributesForIpfs();
            return yield this.getModel().findOne({
                include,
                attributes: postAttributes,
                where: {
                    id,
                    post_type_id: postTypeId,
                },
                raw: true,
            });
        });
    }
    /**
     *
     * @param {number} id
     * @return {Promise<*>}
     */
    static findOneOnlyWithOrganization(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.getModel().findOne({
                where: {
                    id,
                },
                include: [
                    orgModelProvider.getModel(),
                ],
            });
            return res ? res.toJSON() : null;
        });
    }
    static findOneById(id, currentUserId, isRaw = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const include = [
                usersModelProvider.getIncludeAuthorForPreview(),
                postsModelProvider.getPostOfferItselfInclude(),
                postsModelProvider.getPostsStatsInclude(),
                orgModelProvider.getIncludeForPreview(),
                {
                    attributes: models.comments.getFieldsForPreview(),
                    model: models['comments'],
                    as: 'comments',
                    required: false,
                    include: [
                        {
                            model: models['Users'],
                            attributes: userPreviewAttributes,
                            as: 'User',
                        },
                        {
                            model: commentsRepository.getActivityUserCommentModel(),
                            as: commentsRepository.getActivityUserCommentModelName(),
                            required: false,
                        },
                        orgModelProvider.getIncludeForPreview(),
                    ],
                },
                {
                    model: models.posts,
                    as: 'post',
                    required: false,
                    include: [
                        usersModelProvider.getIncludeAuthorForPreview(),
                        postsModelProvider.getPostsStatsInclude(),
                        orgModelProvider.getIncludeForPreview(),
                    ],
                },
                {
                    model: models['post_users_team'],
                    as: 'post_users_team',
                    required: false,
                    include: [
                        usersModelProvider.getIncludeAuthorForPreview(),
                    ],
                },
            ];
            if (currentUserId) {
                include.push({
                    model: models['activity_user_post'],
                    required: false,
                    where: { user_id_from: currentUserId },
                });
            }
            // TODO #performance - make include optional
            const data = yield PostsRepository.getModel().findOne({
                include,
                where: {
                    id,
                },
            });
            if (!data) {
                return data;
            }
            return isRaw ? data.toJSON() : data;
        });
    }
    static findOneByIdAndAuthor(id, userId, raw = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PostsRepository.getModel().findOne({
                raw,
                where: {
                    id,
                    user_id: userId,
                },
            });
        });
    }
    static findAllWithRates() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield PostsRepository.getModel().findAll({
                where: {
                    current_rate: {
                        [Op.gt]: 0,
                    },
                },
                include: [{
                        model: models['Users'],
                    }],
                order: [
                    ['current_rate', 'DESC'],
                    ['id', 'DESC'],
                ],
            });
            return rows.map((row) => {
                return row.toJSON();
            });
        });
    }
    // noinspection JSUnusedGlobalSymbols
    static findOneByBlockchainId(blockchainId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PostsRepository.getModel().findOne({
                where: {
                    blockchain_id: blockchainId,
                },
                raw: true,
            });
        });
    }
    /**
     *
     * @param {integer} userId
     * @returns {Promise<Object>}
     */
    static findLastMediaPostByAuthor(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PostsRepository.getModel().findOne({
                where: {
                    user_id: userId,
                    post_type_id: POST_TYPE__MEDIA_POST,
                },
                raw: true,
                order: [
                    ['id', 'DESC'],
                ],
            });
        });
    }
    /**
     *
     * @param {integer} userId
     * @returns {Promise<number>}
     */
    static findLastMediaPostIdByAuthor(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield PostsRepository.getModel().findOne({
                attributes: [
                    'id',
                ],
                where: {
                    user_id: userId,
                    post_type_id: POST_TYPE__MEDIA_POST,
                },
                raw: true,
                order: [
                    ['id', 'DESC'],
                ],
            });
            return result ? result['id'] : null;
        });
    }
    /**
     *
     * @param {number} userId
     * @return {Promise<*>}
     */
    static findAllByAuthor(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryParameters = {
                where: {
                    user_id: userId,
                },
                order: [
                    ['id', 'DESC'],
                ],
            };
            return yield this.findAllPosts(queryParameters);
        });
    }
    /**
     *
     * @return {Object}
     */
    static getModel() {
        return models[TABLE_NAME];
    }
    /**
     *
     * @return {string}
     */
    static getModelName() {
        return TABLE_NAME;
    }
    /**
     *
     * @param {Object} data
     * @param {number} userId
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    static createNewPost(data, userId, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            data['user_id'] = userId;
            data['current_rate'] = 0;
            data['current_vote'] = 0;
            delete data['id'];
            const newPost = yield PostsRepository.getModel().create(data, { transaction });
            yield postStatsRepository.createNew(newPost.id, transaction);
            return newPost;
        });
    }
    /**
     *
     * @param {number} id
     * @return {Promise<Object>}
     */
    static findOnlyPostItselfById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model.findOne({
                where: { id },
                raw: true,
            });
        });
    }
    static findAllWithTagsForTagCurrentRate(offset = 0, limit = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            // it is ok for tag to have current_rate = 0 because post rate is decreased due to time
            // So WHERE current_rate > 0 for post is not ok for current_rate calculation
            return knex(TABLE_NAME)
                .select(['current_rate', 'entity_tags'])
                .whereRaw("entity_tags != '{}'")
                .offset(offset)
                .limit(limit);
        });
    }
    static setCurrentRateToPost(postId, currentRate) {
        return __awaiter(this, void 0, void 0, function* () {
            yield knex(TABLE_NAME)
                .where('id', postId)
                .update({
                current_rate: currentRate,
            });
        });
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<number>}
     */
    static getPostCurrentVote(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.getModel().findOne({
                attributes: ['current_vote'],
                where: {
                    id,
                },
                raw: true,
            });
            return result ? +result['current_vote'] : null;
        });
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<string|null>}
     */
    static findBlockchainIdById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.getModel().findOne({
                attributes: [
                    'blockchain_id',
                ],
                where: {
                    id,
                },
                raw: true,
            });
            return result ? result.blockchain_id : null;
        });
    }
    static getDefaultOrderBy() {
        return [
            ['current_rate', 'DESC'],
            ['id', 'DESC'],
        ];
    }
    static getDefaultListParams() {
        return {
            where: {},
            offset: 0,
            limit: 10,
            order: this.getDefaultOrderBy(),
        };
    }
}
module.exports = PostsRepository;
