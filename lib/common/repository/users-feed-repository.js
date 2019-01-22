"use strict";
const _ = require('lodash');
const postsModelProvider = require('../../posts/service').ModelProvider;
const usersModelProvider = require('../../users/service').ModelProvider;
const orgModelProvider = require('../../organizations/service').ModelProvider;
const sequelizeIncludes = require('./sequelize-includes');
const models = require('../../../models');
const Op = models.sequelize.Op;
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
        return await postsModelProvider.getModel().count({
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
    /**
     *
     * @param {number} userId
     * @param {Object} givenParams
     * @return {Promise<any[]>}
     */
    static async findAllForUserWallFeed(userId, givenParams = {}) {
        const params = _.defaults(givenParams, this.getDefaultListParams());
        params.attributes = postsModelProvider.getPostsFieldsForPreview();
        params.where = {
            entity_name_for: usersModelProvider.getEntityName(),
            entity_id_for: userId,
        };
        const data = await postsModelProvider.getModel().findAll(params);
        return data.map(model => model.toJSON());
    }
    static getIncludeProcessor() {
        return function (query, params) {
            params.include = sequelizeIncludes.getIncludeForPostList();
            if (!query || !query.include) {
                return;
            }
        };
    }
    /**
     *
     * @param {number} userId
     * @param {number[]} usersIds
     * @param {number[]} orgIds
     * @param {Object} givenParams
     * @return {Promise<any[]>}
     */
    static async findAllForUserNewsFeed(userId, usersIds, orgIds, givenParams) {
        const params = _.defaults(givenParams, this.getDefaultListParams());
        // #task - move to default params
        params.attributes = postsModelProvider.getPostsFieldsForPreview();
        params.where = {
            [Op.or]: [
                {
                    entity_id_for: Array.prototype.concat(usersIds, userId),
                    entity_name_for: usersModelProvider.getEntityName(),
                },
                {
                    entity_id_for: orgIds,
                    entity_name_for: orgModelProvider.getEntityName(),
                },
            ],
        };
        const data = await postsModelProvider.getModel().findAll(params);
        return data.map(model => model.toJSON());
    }
    /**
     *
     * @param {number} userId
     * @param {number[]} usersIds
     * @param {number[]} orgIds
     * @return {Promise<any[]>}
     */
    static async countAllForUserNewsFeed(userId, usersIds, orgIds) {
        const where = {
            [Op.or]: [
                {
                    entity_id_for: _.concat(usersIds, userId),
                    entity_name_for: usersModelProvider.getEntityName(),
                },
                {
                    entity_id_for: orgIds,
                    entity_name_for: orgModelProvider.getEntityName(),
                },
            ],
        };
        return await postsModelProvider.getModel().count({
            where,
        });
    }
    /**
     *
     * @param {number} entityId
     * @return {Promise<*>}
     */
    static async countAllForOrgWallFeed(entityId) {
        const entityNameFor = orgModelProvider.getEntityName();
        return await this.countAllForWallFeed(entityId, entityNameFor);
    }
    /**
     *
     * @param {number} wallOwnerId
     * @return {Promise<*>}
     */
    static async countAllForUserWallFeed(wallOwnerId) {
        const entityNameFor = usersModelProvider.getEntityName();
        return await this.countAllForWallFeed(wallOwnerId, entityNameFor);
    }
    /**
     *
     * @param {number} entityId
     * @param {Object} givenParams
     * @return {Promise<any[]>}
     */
    static async findAllForOrgWallFeed(entityId, givenParams = {}) {
        const params = _.defaults(givenParams, this.getDefaultListParams());
        params.attributes = postsModelProvider.getPostsFieldsForPreview();
        params.where = {
            entity_name_for: orgModelProvider.getEntityName(),
            entity_id_for: entityId,
        };
        params.include = sequelizeIncludes.getIncludeForPostList();
        const models = await postsModelProvider.getModel().findAll(params);
        return models.map((model) => {
            return model.toJSON();
        });
    }
    /**
     *
     * @param {Object} givenParams
     * @returns {Promise<Object[]>}
     * @private
     */
    static async findAllForWallFeed(givenParams) {
        const params = _.defaults(givenParams, this.getDefaultListParams());
        params.attributes = postsModelProvider.getPostsFieldsForPreview();
        params.include = sequelizeIncludes.getIncludeForPostList();
        const models = await postsModelProvider.getModel().findAll(params);
        return models.map((model) => {
            return model.toJSON();
        });
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityNameFor
     * @return {Promise<*>}
     * @private
     */
    static async countAllForWallFeed(entityId, entityNameFor) {
        const tableName = postsModelProvider.getTableName();
        const sql = `
      SELECT COUNT(1)
      FROM
        ${tableName}
      WHERE
        entity_name_for   = '${entityNameFor}'
        AND entity_id_for = ${+entityId}
      `;
        const res = await db.query(sql, { type: db.QueryTypes.SELECT });
        return +res[0].count;
    }
    /**
     *
     * @return {Object}
     * @private
     */
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
