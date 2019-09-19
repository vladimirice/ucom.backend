"use strict";
const knex = require("../../../config/knex");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const KnexQueryBuilderHelper = require("../helper/repository/knex-query-builder-helper");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const UsersModelProvider = require("../../users/users-model-provider");
const _ = require('lodash');
const sequelizeIncludes = require('./sequelize-includes');
const models = require('../../../models');
const { Op } = models.Sequelize;
const db = models.sequelize;
/**
 * repository name is wrong. This repo used to fetch also tags wall feed data
 */
class UsersFeedRepository {
    /**
     *
     * @param {string} tagTitle
     * @param {Object} givenParams
     * @returns {Promise<Object[]>}
     */
    static async findAllPostsForWallFeedByTag(tagTitle, givenParams) {
        givenParams.where = this.whereEntityTagsContain([tagTitle]);
        return this.findAllForWallFeed(givenParams);
    }
    /**
     *
     * @param {string} tagTitle
     * @returns {Promise<number>}
     */
    static async countAllPostsForWallFeedByTag(tagTitle) {
        return PostsModelProvider.getModel().count({
            where: this.whereEntityTagsContain([tagTitle]),
        });
    }
    /**
     *
     * @param {string[]} tagTitles
     * @returns {{entity_tags: {}}}
     * @private
     */
    static whereEntityTagsContain(tagTitles) {
        return {
            entity_tags: {
                [Op.contains]: db.cast(tagTitles, 'text[]'),
            },
        };
    }
    static async findAllForUserWallFeed(userId, givenParams = {}, requestQuery = null) {
        const params = _.defaults(givenParams, this.getDefaultListParams());
        params.attributes = PostsModelProvider.getPostsFieldsForPreview();
        params.where = {
            entity_name_for: UsersModelProvider.getEntityName(),
            entity_id_for: userId,
        };
        this.addExcludePostTypeIdsToSequelizeWhere(requestQuery, params);
        const data = await PostsModelProvider.getModel().findAll(params);
        return data.map((model) => model.toJSON());
    }
    static getIncludeProcessor() {
        // @ts-ignore
        return (query, params) => {
            params.include = sequelizeIncludes.getIncludeForPostList();
        };
    }
    static async findAllForUserNewsFeed(userId, usersIds, orgIds, givenParams, requestQuery) {
        const params = _.defaults(givenParams, this.getDefaultListParams());
        // #task - move to default params
        params.attributes = PostsModelProvider.getPostsFieldsForPreview();
        params.where = {
            [Op.or]: [
                {
                    entity_id_for: Array.prototype.concat(usersIds, userId),
                    entity_name_for: UsersModelProvider.getEntityName(),
                },
                {
                    entity_id_for: orgIds,
                    entity_name_for: OrganizationsModelProvider.getEntityName(),
                },
            ],
        };
        this.addExcludePostTypeIdsToSequelizeWhere(requestQuery, params);
        const data = await PostsModelProvider.getModel().findAll(params);
        return data.map((model) => model.toJSON());
    }
    static addExcludePostTypeIdsToSequelizeWhere(requestQuery, params) {
        if (requestQuery && requestQuery.exclude_post_type_ids) {
            params.where.post_type_id = {
                [Op.notIn]: requestQuery.exclude_post_type_ids,
            };
        }
    }
    static async countAllForUserNewsFeed(userId, usersIds, orgIds, requestQuery) {
        const params = {
            where: {
                [Op.or]: [
                    {
                        entity_id_for: Array.prototype.concat(usersIds, userId),
                        entity_name_for: UsersModelProvider.getEntityName(),
                    },
                    {
                        entity_id_for: orgIds,
                        entity_name_for: OrganizationsModelProvider.getEntityName(),
                    },
                ],
            },
        };
        this.addExcludePostTypeIdsToSequelizeWhere(requestQuery, params);
        return PostsModelProvider.getModel().count(params);
    }
    static async countAllForOrgWallFeed(entityId) {
        return this.countAllForWallFeed(entityId, OrganizationsModelProvider.getEntityName());
    }
    static async countAllForUserWallFeed(wallOwnerId, postsQuery = null) {
        return this.countAllForWallFeed(wallOwnerId, UsersModelProvider.getEntityName(), postsQuery);
    }
    /**
     *
     * @param {number} entityId
     * @param {Object} givenParams
     * @return {Promise<any[]>}
     */
    static async findAllForOrgWallFeed(entityId, givenParams = {}) {
        const params = _.defaults(givenParams, this.getDefaultListParams());
        params.attributes = PostsModelProvider.getPostsFieldsForPreview();
        params.where = {
            entity_name_for: OrganizationsModelProvider.getEntityName(),
            entity_id_for: entityId,
        };
        const data = await PostsModelProvider.getModel().findAll(params);
        return data.map((model) => model.toJSON());
    }
    /**
     *
     * @param {Object} givenParams
     * @returns {Promise<Object[]>}
     * @private
     */
    static async findAllForWallFeed(givenParams) {
        const params = _.defaults(givenParams, this.getDefaultListParams());
        params.attributes = PostsModelProvider.getPostsFieldsForPreview();
        params.include = sequelizeIncludes.getIncludeForPostList();
        const data = await PostsModelProvider.getModel().findAll(params);
        return data.map((model) => model.toJSON());
    }
    static async countAllForWallFeed(entityIdFor, entityNameFor, requestQuery = null) {
        const queryBuilder = knex(PostsModelProvider.getTableName())
            .where({
            entity_name_for: entityNameFor,
            entity_id_for: entityIdFor,
        });
        if (requestQuery && requestQuery.exclude_post_type_ids) {
            queryBuilder.whereNotIn('post_type_id', requestQuery.exclude_post_type_ids);
        }
        return KnexQueryBuilderHelper.addCountToQueryBuilderAndCalculate(queryBuilder);
    }
    static getDefaultListParams() {
        return {
            offset: 0,
            limit: 10,
            where: {},
            order: this.getDefaultOrderBy(),
        };
    }
    /**
     *
     * @return {string[][]}
     * @private
     */
    static getDefaultOrderBy() {
        return [
            ['id', 'DESC'],
        ];
    }
}
module.exports = UsersFeedRepository;
