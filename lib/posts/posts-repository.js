"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const errors_1 = require("../api/errors");
const OrganizationsModelProvider = require("../organizations/service/organizations-model-provider");
const RepositoryHelper = require("../common/repository/repository-helper");
const PostsModelProvider = require("./service/posts-model-provider");
const EntityListCategoryDictionary = require("../stats/dictionary/entity-list-category-dictionary");
const _ = require('lodash');
const moment = require('moment');
const models = require('../../models');
// @deprecated
const ENTITY_STATS_CURRENT_TABLE_NAME = 'entity_stats_current';
const CURRENT_PARAMS = PostsModelProvider.getCurrentParamsTableName();
const entityStatsCurrentModel = models[ENTITY_STATS_CURRENT_TABLE_NAME];
const db = models.sequelize;
const { Op } = db.Sequelize;
const orgModelProvider = require('../organizations/service/organizations-model-provider');
const postsModelProvider = require('./service/posts-model-provider');
const usersModelProvider = require('../users/users-model-provider');
const POST_TYPE__MEDIA_POST = ucom_libs_common_1.ContentTypesDictionary.getTypeMediaPost();
const userPreviewAttributes = usersModelProvider.getUserFieldsForPreview();
const postStatsRepository = require('./stats/post-stats-repository');
const commentsRepository = require('../comments/comments-repository');
const TABLE_NAME = 'posts';
const model = postsModelProvider.getModel();
const knex = require('../../config/knex');
// @ts-ignore
class PostsRepository {
    static async countAllRepostsOfMediaPosts() {
        const typeId = ucom_libs_common_1.ContentTypesDictionary.getTypeMediaPost();
        return PostsRepository.countAllRepostsByParentType(typeId);
    }
    static async countAllRepostsByDirectPosts() {
        const typeId = ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost();
        return PostsRepository.countAllRepostsByParentType(typeId);
    }
    static async countAllRepostsByParentType(parentType) {
        const typeRepost = ucom_libs_common_1.ContentTypesDictionary.getTypeRepost();
        const sql = `
      SELECT COUNT(1) FROM posts AS t
      INNER JOIN posts AS r 
        ON  t.parent_id = r.id 
        AND t.parent_id IS NOT NULL 
        AND t.post_type_id = ${+typeRepost}
        AND r.post_type_id = ${parentType}
    `;
        const res = await knex.raw(sql);
        return +res.rows[0].count;
    }
    static async countAllMediaPosts() {
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where({
            post_type_id: ucom_libs_common_1.ContentTypesDictionary.getTypeMediaPost(),
        });
        return +res[0].amount;
    }
    static async countAllDirectPosts() {
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where({
            post_type_id: ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost(),
        });
        return +res[0].amount;
    }
    static async getManyOrgsPostsAmount() {
        const orgEntityName = OrganizationsModelProvider.getEntityName();
        const postTypes = [
            ucom_libs_common_1.ContentTypesDictionary.getTypeMediaPost(),
            ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost(),
        ];
        const sql = `
      SELECT array_agg(post_type_id || '__' || amount) AS array_agg, entity_id_for FROM
        (
          SELECT entity_id_for, post_type_id, COUNT(1) AS amount
          FROM posts
          WHERE entity_name_for = '${orgEntityName}'
          AND post_type_id IN (${postTypes.join(', ')})
          GROUP BY entity_id_for, post_type_id
        ) AS t
      GROUP BY entity_id_for
    `;
        const data = await knex.raw(sql);
        return data.rows.map((row) => ({
            aggregates: RepositoryHelper.splitAggregates(row),
            entityId: +row.entity_id_for,
        }));
    }
    static async getManyUsersPostsAmount() {
        const postTypes = [
            ucom_libs_common_1.ContentTypesDictionary.getTypeMediaPost(),
            ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost(),
        ];
        const sql = `
      SELECT array_agg(post_type_id || '__' || amount) AS array_agg, user_id FROM
        (
          SELECT user_id, post_type_id, COUNT(1) AS amount
          FROM posts
          WHERE post_type_id IN (${postTypes.join(', ')})
          GROUP BY user_id, post_type_id
        ) AS t
      GROUP BY user_id
    `;
        const data = await knex.raw(sql);
        return data.rows.map((row) => ({
            aggregates: RepositoryHelper.splitAggregates(row),
            entityId: +row.user_id,
        }));
    }
    static async getManyPostsRepostsAmount() {
        const postTypeId = ucom_libs_common_1.ContentTypesDictionary.getTypeRepost();
        const sql = `
       SELECT parent_id, blockchain_id, COUNT(1) AS amount FROM posts
       WHERE post_type_id = ${postTypeId}
       GROUP BY parent_id, blockchain_id
    `;
        const data = await knex.raw(sql);
        return data.rows.map((item) => ({
            entityId: item.parent_id,
            blockchainId: item.blockchain_id,
            repostsAmount: +item.amount,
        }));
    }
    static async findManyPostsEntityEvents(limit, lastId = null) {
        const queryBuilder = knex('posts')
            .select(['id', 'blockchain_id', 'current_rate'])
            .orderBy('id', 'ASC')
            .limit(limit);
        if (lastId) {
            // noinspection JSIgnoredPromiseFromCall
            queryBuilder.whereRaw(`id > ${+lastId}`);
        }
        return queryBuilder;
    }
    /**
     *
     * @param {number} id
     * @param {Object} entityTags
     * @param {Transaction} trx
     * @returns {Promise<void>}
     */
    static async updatePostEntityTagsById(id, entityTags, trx) {
        // noinspection JSCheckFunctionSignatures
        return trx(postsModelProvider.getTableName())
            .update({ entity_tags: entityTags })
            .where('id', '=', id)
            .returning('*');
    }
    /**
     *
     * @param {string[]} blockchainIds
     * @return {Promise<Object>}
     */
    static async findIdsByBlockchainIds(blockchainIds) {
        // noinspection TypeScriptValidateJSTypes
        const data = await this.getModel().findAll({
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
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @returns {Function}
     */
    static getWhereProcessor() {
        return (query, params) => {
            if (query.post_type_id) {
                params.where.post_type_id = +query.post_type_id;
            }
            else if (query.post_type_ids) {
                params.where.post_type_id = {
                    [Op.in]: query.post_type_ids,
                };
            }
            this.andWhereByOverviewType(query, params);
            this.processEntityNamesFrom(query, params);
            this.processEntityNamesFor(query, params);
        };
    }
    static whereSequelizeTranding() {
        const greaterThan = process.env.NODE_ENV === 'staging' ? -100 : 0;
        return {
            importance_delta: db.where(db.col(`${PostsModelProvider.getCurrentParamsTableName()}.importance_delta`), {
                [Op.gt]: greaterThan,
            }),
            upvotes_delta: db.where(db.col(`${PostsModelProvider.getCurrentParamsTableName()}.upvotes_delta`), {
                [Op.gt]: greaterThan,
            }),
        };
    }
    static whereSequelizeHot() {
        const greaterThan = process.env.NODE_ENV === 'staging' ? -100 : 0;
        return {
            activity_index: db.where(db.col(`${PostsModelProvider.getCurrentParamsTableName()}.activity_index_delta`), {
                [Op.gt]: greaterThan,
            }),
        };
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @returns {Object}
     */
    static getOrderByRelationMap(forSequelize = true) {
        if (forSequelize) {
            return {
                comments_count: [
                    postsModelProvider.getPostStatsModel(),
                    'comments_count',
                ],
                importance_delta: [
                    postsModelProvider.getCurrentParamsSequelizeModel(),
                    'importance_delta',
                ],
                activity_index_delta: [
                    postsModelProvider.getCurrentParamsSequelizeModel(),
                    'activity_index_delta',
                ],
            };
        }
        return {
            comments_count: `${PostsModelProvider.getPostsStatsTableName()}.comments_count`,
            importance_delta: `${PostsModelProvider.getCurrentParamsTableName()}.importance_delta`,
            activity_index_delta: `${PostsModelProvider.getCurrentParamsTableName()}.activity_index_delta`,
        };
    }
    // noinspection JSUnusedGlobalSymbols
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
            'activity_index_delta',
            'importance_delta',
        ];
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {number} id
     * @return {Promise<boolean>}
     */
    static async isForOrganization(id) {
        const where = {
            id,
            organization_id: {
                [Op.ne]: null,
            },
        };
        const res = await model.count({
            where,
        });
        return !!res;
    }
    static async changeCurrentVotesByActivityType(postId, interactionType, transaction) {
        const allowed = [
            ucom_libs_common_1.InteractionTypesDictionary.getUpvoteId(),
            ucom_libs_common_1.InteractionTypesDictionary.getDownvoteId(),
        ];
        if (!allowed.includes(interactionType)) {
            throw new errors_1.AppError(`Allowed interaction types are: ${allowed}`);
        }
        const queryBuilder = transaction(TABLE_NAME)
            .where('id', postId);
        if (interactionType === ucom_libs_common_1.InteractionTypesDictionary.getUpvoteId()) {
            queryBuilder.increment('current_vote', 1);
        }
        else {
            queryBuilder.decrement('current_vote', 1);
        }
        await queryBuilder;
    }
    static async findLastByAuthor(userId, isRaw = true) {
        const data = await this.getModel().findOne({
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
    }
    static async findFirstMediaPostIdUserId(userId) {
        const data = await this.getModel().findOne({
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
    }
    /**
     *
     * @param {number} userId
     * @return {Promise<number|null>}
     */
    static async findLastMediaPostIdUserId(userId) {
        const data = await this.getModel().findOne({
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
    }
    // noinspection JSUnusedGlobalSymbols
    static async findLast(isRaw = true) {
        const data = await this.getModel().findOne({
            where: {
                post_type_id: POST_TYPE__MEDIA_POST,
            },
            order: [
                ['id', 'DESC'],
            ],
            limit: 1,
        });
        return isRaw ? data.toJSON() : data;
    }
    /**
     *
     * @param {boolean} raw
     * @returns {Promise<Object>}
     */
    static async findAllMediaPosts(raw = true) {
        // noinspection TypeScriptValidateJSTypes
        return this.getModel().findAll({
            raw,
            where: {
                post_type_id: POST_TYPE__MEDIA_POST,
            },
        });
    }
    /**
     *
     * @param {Object | null} queryParameters
     * @returns {Promise<number>}
     */
    static async countAllPosts(queryParameters = null) {
        const include = [
            PostsModelProvider.getCurrentParamsSequelizeInclude(),
            {
                attributes: [],
                model: entityStatsCurrentModel,
                required: false,
            },
        ];
        const where = queryParameters !== null ? queryParameters.where : {};
        return PostsRepository.getModel().count({
            where,
            include,
        });
    }
    /**
     *
     * @param {string} field
     * @returns {Promise<Object>}
     */
    static async findMinPostIdByParameter(field) {
        const order = [];
        order[0] = [field, 'ASC'];
        order[1] = ['id', 'DESC'];
        const result = await PostsRepository.getModel().findOne({
            order,
            attributes: [
                'id',
            ],
            limit: 1,
            raw: true,
        });
        return result ? result.id : null;
    }
    /**
     *
     * @param {string} field
     * @returns {Promise<Object>}
     */
    static async findMaxPostIdByParameter(field) {
        const order = [];
        order[0] = [field, 'DESC'];
        order[1] = ['id', 'DESC'];
        const result = await PostsRepository.getModel().findOne({
            order,
            attributes: [
                'id',
            ],
            limit: 1,
            raw: true,
        });
        return result ? result.id : null;
    }
    /**
     *
     * @param {Object|null} queryParameters
     * @return {Promise<any[]>}
     */
    static async findAllPosts(queryParameters = {}) {
        const params = _.defaults(queryParameters, this.getDefaultListParams());
        params.order.push(['id', 'DESC']);
        const data = await postsModelProvider.getModel().findAll(params);
        return data.map((item) => item.toJSON());
    }
    // noinspection JSUnusedGlobalSymbols
    static getIncludeProcessor() {
        // @ts-ignore
        return (query, params) => {
            params.include = [
                orgModelProvider.getIncludeForPreview(),
                usersModelProvider.getIncludeAuthorForPreview(),
                postsModelProvider.getPostsStatsInclude(),
                postsModelProvider.getPostOfferItselfInclude(),
                postsModelProvider.getParentPostInclude(),
                postsModelProvider.getCurrentParamsSequelizeInclude(),
            ];
        };
    }
    // noinspection JSUnusedGlobalSymbols
    static async findOneForIpfs(id, postTypeId) {
        const postOfferAttributes = models.post_offer.getPostOfferAttributesForIpfs();
        const include = [
            {
                attributes: ['account_name'],
                model: models.Users,
            },
        ];
        if (postTypeId === ucom_libs_common_1.ContentTypesDictionary.getTypeOffer()) {
            include.push({
                attributes: postOfferAttributes,
                model: models.post_offer,
            });
        }
        const postAttributes = this.getModel().getMediaPostAttributesForIpfs();
        return this.getModel().findOne({
            include,
            attributes: postAttributes,
            where: {
                id,
                post_type_id: postTypeId,
            },
            raw: true,
        });
    }
    /**
     *
     * @param {number} id
     * @return {Promise<*>}
     */
    static async findOneOnlyWithOrganization(id) {
        const res = await this.getModel().findOne({
            where: {
                id,
            },
            include: [
                orgModelProvider.getModel(),
            ],
        });
        return res ? res.toJSON() : null;
    }
    static async findOneByIdV2(id, isRaw = false) {
        const include = [
            usersModelProvider.getIncludeAuthorForPreview(),
            postsModelProvider.getPostOfferItselfInclude(),
            postsModelProvider.getPostsStatsInclude(),
            orgModelProvider.getIncludeForPreview(),
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
                model: models.post_users_team,
                as: 'post_users_team',
                required: false,
                include: [
                    usersModelProvider.getIncludeAuthorForPreview(),
                ],
            },
        ];
        // #performance - make include optional
        const data = await PostsRepository.getModel().findOne({
            include,
            where: {
                id,
            },
        });
        if (!data) {
            return null;
        }
        return isRaw ? data.toJSON() : data;
    }
    static async findOneById(id, currentUserId = null, isRaw = false) {
        const include = [
            usersModelProvider.getIncludeAuthorForPreview(),
            postsModelProvider.getPostOfferItselfInclude(),
            postsModelProvider.getPostsStatsInclude(),
            orgModelProvider.getIncludeForPreview(),
            {
                attributes: models.comments.getFieldsForPreview(),
                model: models.comments,
                as: 'comments',
                required: false,
                include: [
                    {
                        model: models.Users,
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
                model: models.post_users_team,
                as: 'post_users_team',
                required: false,
                include: [
                    usersModelProvider.getIncludeAuthorForPreview(),
                ],
            },
        ];
        if (currentUserId) {
            include.push({
                model: models.activity_user_post,
                required: false,
                where: { user_id_from: currentUserId },
            });
        }
        // #performance - make include optional
        const data = await PostsRepository.getModel().findOne({
            include,
            where: {
                id,
            },
        });
        if (!data) {
            return data;
        }
        return isRaw ? data.toJSON() : data;
    }
    // noinspection JSUnusedGlobalSymbols
    static async findOneByIdAndAuthor(id, userId, raw = true) {
        return PostsRepository.getModel().findOne({
            raw,
            where: {
                id,
                user_id: userId,
            },
        });
    }
    // noinspection JSUnusedGlobalSymbols
    static async findAllWithRates() {
        // noinspection TypeScriptValidateJSTypes
        const rows = await PostsRepository.getModel().findAll({
            where: {
                current_rate: {
                    [Op.gt]: 0,
                },
            },
            include: [{
                    model: models.Users,
                }],
            order: [
                ['current_rate', 'DESC'],
                ['id', 'DESC'],
            ],
        });
        return rows.map((row) => row.toJSON());
    }
    // noinspection JSUnusedGlobalSymbols
    static async findOneByBlockchainId(blockchainId) {
        return PostsRepository.getModel().findOne({
            where: {
                blockchain_id: blockchainId,
            },
            raw: true,
        });
    }
    /**
     *
     * @param {integer} userId
     * @returns {Promise<Object>}
     */
    static async findLastMediaPostByAuthor(userId) {
        return PostsRepository.getModel().findOne({
            where: {
                user_id: userId,
                post_type_id: POST_TYPE__MEDIA_POST,
            },
            raw: true,
            order: [
                ['id', 'DESC'],
            ],
        });
    }
    /**
     *
     * @param {integer} userId
     * @returns {Promise<number>}
     */
    static async findLastMediaPostIdByAuthor(userId) {
        const result = await PostsRepository.getModel().findOne({
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
        return result ? result.id : null;
    }
    /**
     *
     * @param {number} userId
     * @return {Promise<*>}
     */
    static async findAllByAuthor(userId) {
        const queryParameters = {
            where: {
                user_id: userId,
            },
            order: [
                ['id', 'DESC'],
            ],
        };
        return this.findAllPosts(queryParameters);
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
    static async createAutoUpdate(transaction, user_id, entity_id_for, entity_name_for, blockchain_id, json_data) {
        const result = await transaction(TABLE_NAME).insert(Object.assign({ post_type_id: ucom_libs_common_1.ContentTypesDictionary.getTypeAutoUpdate(), user_id,
            entity_id_for,
            entity_name_for,
            blockchain_id,
            json_data }, this.getCreateDefaultFields())).returning('id');
        return +result;
    }
    static async createNewPost(data, userId, transaction) {
        data.user_id = userId;
        data.current_rate = 0;
        data.current_vote = 0;
        delete data.id;
        const newPost = await PostsRepository.getModel().create(data, { transaction });
        // @deprecated
        await postStatsRepository.createNew(newPost.id, transaction);
        return newPost;
    }
    static async findLastAutoUpdateId() {
        const result = await knex(TABLE_NAME).where({
            post_type_id: ucom_libs_common_1.ContentTypesDictionary.getTypeAutoUpdate(),
        })
            .orderBy('id', 'DESC')
            .limit(1)
            .first();
        return result ? result.id : null;
    }
    static async findOnlyPostItselfById(id, transaction = null) {
        return model.findOne({
            transaction,
            where: { id },
            raw: true,
        });
    }
    static prepareRelatedEntitySqlParts(overviewType, params, statsFieldName, relEntityField, relEntityNotNull) {
        let whereRawOverviewBounds = '';
        let joinWithStats = false;
        let extraFieldsToSelect = '';
        if (EntityListCategoryDictionary.isOverviewWithStats(overviewType)) {
            if (!params.whereRaw) {
                throw new errors_1.AppError(`It is required to fill params.whereRaw for overviewType: ${overviewType}. Current params set is: ${JSON.stringify(params)}`, 500);
            }
            whereRawOverviewBounds = `AND ${params.whereRaw}`;
            joinWithStats = true;
            extraFieldsToSelect = `, "t".${statsFieldName}`;
        }
        const postSubQuery = PostsRepository.getSubQueryForFindingRelatedEntities(joinWithStats, relEntityField, statsFieldName, whereRawOverviewBounds, params, relEntityNotNull);
        return {
            postSubQuery,
            extraFieldsToSelect,
        };
    }
    static prepareSubQueryForCounting(overviewType, relEntityField, statsFieldName, params, relEntityNotNull) {
        let whereRawOverviewBounds = '';
        let joinWithStats = false;
        if (EntityListCategoryDictionary.isOverviewWithStats(overviewType)) {
            if (!params.whereRaw) {
                throw new errors_1.AppError(`It is required to fill params.whereRaw for overviewType: ${overviewType}. Current params set is: ${JSON.stringify(params)}`, 500);
            }
            whereRawOverviewBounds = params.whereRaw;
            joinWithStats = true;
        }
        return this.getSubQueryForCountingRelatedEntities(joinWithStats, relEntityField, statsFieldName, whereRawOverviewBounds, relEntityNotNull);
    }
    static getSubQueryForCountingRelatedEntities(joinWithStats, relEntityField, statsFieldName, whereRawOverviewBounds, relEntityNotNull) {
        const innerJoinWithStats = joinWithStats ? this.getInnerJoinWithStats() : '';
        const whereParts = [];
        if (whereRawOverviewBounds) {
            whereParts.push(whereRawOverviewBounds);
        }
        if (relEntityNotNull) {
            whereParts.push(`${relEntityField} IS NOT NULL`);
        }
        let whereString = '';
        if (whereParts.length > 0) {
            whereString += `WHERE ${whereParts.join(' AND ')}`;
        }
        return `
      SELECT DISTINCT ON (${relEntityField}) ${relEntityField}, ${statsFieldName} FROM ${TABLE_NAME}
      ${innerJoinWithStats}
      ${whereString}
      ORDER BY ${relEntityField}, ${statsFieldName} DESC
    `;
    }
    static getSubQueryForFindingRelatedEntities(joinWithStats, relEntityField, statsFieldName, whereRawOverviewBounds, params, relEntityNotNull) {
        const innerJoinWithStats = joinWithStats ? this.getInnerJoinWithStats() : '';
        const notNullWhere = relEntityNotNull ? ` AND ${relEntityField} IS NOT NULL ` : '';
        return `
       (
         SELECT ${relEntityField}, ${statsFieldName}
         FROM (SELECT DISTINCT ON (${relEntityField}) ${relEntityField}, ${statsFieldName}, ${TABLE_NAME}.id AS inner_posts_id
               FROM ${TABLE_NAME}
                ${innerJoinWithStats}
               WHERE 
                  ${TABLE_NAME}.post_type_id = ${+params.where.post_type_id}
                  ${whereRawOverviewBounds}
                  ${notNullWhere}
               ORDER BY ${relEntityField}, ${statsFieldName} DESC, inner_posts_id DESC
              ) as inner_t
         ORDER BY ${statsFieldName} DESC, inner_t.inner_posts_id DESC
         LIMIT  ${params.limit}
         OFFSET ${params.offset}
       ) as t
    `;
    }
    static getInnerJoinWithStats() {
        return `
     INNER JOIN "${CURRENT_PARAMS}" on "${TABLE_NAME}"."id" = "${CURRENT_PARAMS}"."post_id" 
    `;
    }
    static async findAllWithTagsForTagCurrentRate(offset = 0, limit = 10) {
        // it is ok for tag to have current_rate = 0 because post rate is decreased due to time
        // So WHERE current_rate > 0 for post is not ok for current_rate calculation
        return knex(TABLE_NAME)
            .select(['current_rate', 'entity_tags', 'post_type_id'])
            .whereRaw("entity_tags != '{}'")
            .offset(offset)
            .limit(limit);
    }
    static async setCurrentRateToPost(postId, currentRate) {
        await knex(TABLE_NAME)
            .where('id', postId)
            .update({
            current_rate: currentRate,
        });
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<number>}
     */
    static async getPostCurrentVote(id) {
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
     * @returns {Promise<string|null>}
     */
    static async findBlockchainIdById(id) {
        const result = await this.getModel().findOne({
            attributes: [
                'blockchain_id',
            ],
            where: {
                id,
            },
            raw: true,
        });
        return result ? result.blockchain_id : null;
    }
    static processEntityNamesFrom(query, params) {
        const entityNamesFrom = query.entity_names_from;
        if (!entityNamesFrom) {
            return;
        }
        const allowed = [
            ucom_libs_common_1.EntityNames.ORGANIZATIONS,
            ucom_libs_common_1.EntityNames.USERS,
        ];
        if (entityNamesFrom.length === 0) {
            throw new errors_1.BadRequestError(`entity_names_from is provided but it is an empty array. Please add values. Allowed ones: are ${allowed}`);
        }
        if (entityNamesFrom.length > 2) {
            throw new errors_1.BadRequestError('There is no business case yet for entity_names_from length to be more than 2. If there is such case, please consider removing this error.');
        }
        if (_.isEqual([ucom_libs_common_1.EntityNames.ORGANIZATIONS], entityNamesFrom)) {
            params.where.organization_id = {
                [Op.ne]: null,
            };
            return;
        }
        if (_.isEqual([ucom_libs_common_1.EntityNames.USERS], entityNamesFrom)) {
            params.where.organization_id = {
                [Op.eq]: null,
            };
            return;
        }
        if (_.isEqual([ucom_libs_common_1.EntityNames.USERS, ucom_libs_common_1.EntityNames.ORGANIZATIONS].sort(), entityNamesFrom.sort())) {
            // do nothing
            return;
        }
        throw new errors_1.BadRequestError(`Unsupported set for entity_names_from: ${entityNamesFrom}`);
    }
    static processEntityNamesFor(query, params) {
        const entityNamesFor = query.entity_names_for;
        if (!entityNamesFor) {
            return;
        }
        const allowed = [
            ucom_libs_common_1.EntityNames.ORGANIZATIONS,
            ucom_libs_common_1.EntityNames.USERS,
        ];
        if (entityNamesFor.length === 0) {
            throw new errors_1.BadRequestError(`entity_names_for is provided but it is an empty array. Please add values. Allowed ones: are ${allowed}`);
        }
        const notAllowed = _.difference(entityNamesFor, allowed);
        if (notAllowed.length > 0) {
            throw new errors_1.BadRequestError(`entity_names_for values ${notAllowed} are not allowed. Allowed ones are: ${allowed}`);
        }
        // #consistency - This is a business case consistency check to avoid possible errors not covered by autotests
        if (entityNamesFor.length > 2) {
            throw new errors_1.BadRequestError('There is no business case yet for entity_names_for length to be more than 2. If there is such case, please consider removing this error.');
        }
        params.where.entity_name_for = {
            [Op.in]: entityNamesFor,
        };
    }
    static getDefaultOrderBy() {
        return [
            ['current_rate', 'DESC'],
            ['id', 'DESC'],
        ];
    }
    static getDefaultListParams() {
        return {
            attributes: this.getModel().getFieldsForPreview(),
            where: {},
            offset: 0,
            limit: 10,
            order: this.getDefaultOrderBy(),
        };
    }
    static andWhereByOverviewType(query, params) {
        if (!query.overview_type) {
            return;
        }
        switch (query.overview_type) {
            case EntityListCategoryDictionary.getTrending():
                Object.assign(params.where, this.whereSequelizeTranding());
                params.whereRaw = this.whereRawTrending();
                break;
            case EntityListCategoryDictionary.getHot():
                Object.assign(params.where, this.whereSequelizeHot());
                params.whereRaw = this.whereRawHot();
                break;
            case EntityListCategoryDictionary.getFresh():
                params.whereRaw = '';
                break;
            case EntityListCategoryDictionary.getTop():
                params.whereRaw = '';
                break;
            default:
                throw new errors_1.AppError(`Unsupported overview type: ${query.overview_type}`, 500);
        }
    }
    static whereRawTrending() {
        const lowerLimit = process.env.NODE_ENV === 'staging' ? (-100) : 0;
        const tableName = PostsModelProvider.getCurrentParamsTableName();
        return `${tableName}.importance_delta > ${lowerLimit} AND ${tableName}.upvotes_delta > ${lowerLimit}`;
    }
    static whereRawHot() {
        const lowerLimit = process.env.NODE_ENV === 'staging' ? (-100) : 0;
        const tableName = PostsModelProvider.getCurrentParamsTableName();
        return `${tableName}.activity_index_delta > ${lowerLimit}`;
    }
    static getCreateDefaultFields() {
        return {
            current_vote: 0,
            entity_images: {},
            created_at: moment().utc().toDate(),
            updated_at: moment().utc().toDate(),
        };
    }
}
module.exports = PostsRepository;
