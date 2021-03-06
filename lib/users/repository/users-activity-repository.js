"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const errors_1 = require("../../api/errors");
const knex = require("../../../config/knex");
const RepositoryHelper = require("../../common/repository/repository-helper");
const UsersActivityWhere = require("./users-activity/users-activity-where");
const BlockchainModelProvider = require("../../eos/service/blockchain-model-provider");
const UsersModelProvider = require("../users-model-provider");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const { Dictionary } = require('ucom-libs-wallet');
const models = require('../../../models');
const db = models.sequelize;
const { Op } = models.Sequelize;
const activityGroupDictionary = require('../../activity/activity-group-dictionary');
const blockchainStatusDictionary = require('../../eos/eos-blockchain-status-dictionary');
const commentsModelProvider = require('../../comments/service/comments-model-provider');
const TABLE_NAME = 'users_activity';
const model = UsersModelProvider.getUsersActivityModel();
class UsersActivityRepository {
    static async countAllUpvotes() {
        const filter = UsersActivityWhere.getUpvoteFilter();
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where(filter);
        return +res[0].amount;
    }
    static async countAllDownvotes() {
        const filter = UsersActivityWhere.getDownvoteFilter();
        const res = await knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where(filter);
        return +res[0].amount;
    }
    static async getPostsVotes() {
        const eventIds = [
            ucom_libs_common_1.EventsIdsDictionary.getUserUpvotesPostOfOrg(),
            ucom_libs_common_1.EventsIdsDictionary.getUserUpvotesPostOfOtherUser(),
            ucom_libs_common_1.EventsIdsDictionary.getUserDownvotesPostOfOrg(),
            ucom_libs_common_1.EventsIdsDictionary.getUserDownvotesPostOfOtherUser(),
        ];
        const sql = `
      SELECT array_agg(activity_type_id || '__' || amount ORDER BY activity_type_id), entity_id_to FROM
        (
          SELECT COUNT(1) as amount, activity_type_id, entity_id_to FROM users_activity
          WHERE event_id IN (${eventIds.join(', ')})
          GROUP BY entity_id_to, activity_type_id
        ) as activity
      GROUP BY entity_id_to;
    `;
        const data = await knex.raw(sql);
        return data.rows;
    }
    // Should be used only for the statistics when you add-subtract total numbers.
    // It is not suitable for `current state` tasks
    static async getManyOrgsFollowers() {
        const paramField = 'event_id';
        const entityIdFields = 'entity_id_to';
        const eventIds = [
            ucom_libs_common_1.EventsIdsDictionary.getUserFollowsOrg(),
            ucom_libs_common_1.EventsIdsDictionary.getUserUnfollowsOrg(),
        ];
        return this.getManyEntityParametersByEvents(paramField, entityIdFields, eventIds);
    }
    static async getManyEntityParametersByEvents(paramField, entityIdField, eventIds) {
        const sql = `
      SELECT array_agg(${paramField} || '__' || amount), ${entityIdField} FROM
        (
          SELECT COUNT(1) as amount, ${paramField}, ${entityIdField} FROM users_activity
          WHERE ${paramField} IN (${eventIds.join(', ')})
          GROUP BY ${entityIdField}, ${paramField}
        ) as t
      GROUP BY ${entityIdField};
    `;
        const data = await knex.raw(sql);
        return data.rows.map((row) => ({
            aggregates: RepositoryHelper.splitAggregates(row),
            entityId: +row[entityIdField],
        }));
    }
    /**
     * @param {Object} data
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    static async createNewActivity(data, transaction) {
        return this.getModel().create(data, { transaction });
    }
    static async createNewKnexActivity(row, trx = null) {
        const queryBuilder = trx ? trx(TABLE_NAME) : knex(TABLE_NAME);
        const data = await queryBuilder.insert(row).returning('*');
        return data[0];
    }
    /**
     *
     * @return {string[]}
     */
    static getAllowedOrderBy() {
        return [
            'id', 'title', 'votes_count', 'votes_amount', 'bp_status',
        ];
    }
    /**
     *
     * @param {number} userId
     * @param {number} postId
     * @return {Promise<number>}
     */
    static async doesUserHaveRepost(userId, postId) {
        const where = {
            user_id_from: userId,
            entity_id_on: postId,
            event_id: [
                ucom_libs_common_1.EventsIdsDictionary.getUserRepostsOtherUserPost(),
                ucom_libs_common_1.EventsIdsDictionary.getUserRepostsOrgPost(),
            ],
        };
        const res = await model.count({
            where,
        });
        return !!res;
    }
    /**
     *
     * @param {Object} data
     * @param {Object} transaction
     * @return {Promise<Object>}
     */
    static async bulkCreateNewActivity(data, transaction) {
        // noinspection TypeScriptValidateJSTypes
        return this.getModel().bulkCreate(data, { transaction });
    }
    /**
     *
     * @param {number} userId
     * @param {number[]} postsIds
     * @return {Promise<Object[]>}
     */
    static async findOneUserToPostsVotingAndRepostActivity(userId, postsIds) {
        if (postsIds.length === 0) {
            return {};
        }
        const groupIdContentCreation = activityGroupDictionary.getGroupContentCreation();
        const groupIdContentInteraction = activityGroupDictionary.getGroupContentInteraction();
        const postsEntityName = PostsModelProvider.getEntityName();
        const eventIdRelatedToRepost = ucom_libs_common_1.EventsIdsDictionary.getEventIdsRelatedToRepost();
        const votingActivityTypes = [
            ucom_libs_common_1.InteractionTypesDictionary.getUpvoteId(),
            ucom_libs_common_1.InteractionTypesDictionary.getDownvoteId(),
        ];
        const sql = `
        SELECT
            DISTINCT ON (entity_id_to, activity_group_id) -- fetch last state. In future it might be voting history
                        event_id,
                        activity_type_id,
                        activity_group_id,
                        entity_id_to,
                        entity_id_on
        FROM
             users_activity
        WHERE
            user_id_from    = ${+userId}
            AND entity_name = '${postsEntityName}'
            AND
            (
              entity_id_to IN (${postsIds.join(', ')}) OR entity_id_on IN (${postsIds.join(', ')}) -- for ex. upvote or repost on
            )
            AND (
                  (
                    activity_group_id = ${groupIdContentInteraction} AND activity_type_id IN (${votingActivityTypes.join(',')})
                  )
                  OR
                  (
                    activity_group_id = ${groupIdContentCreation} AND event_id IN (${eventIdRelatedToRepost.join(',')}) -- repost only
                  )
                )
        ORDER BY entity_id_to, activity_group_id, id DESC
    `;
        const dbData = await models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
        const posts = {};
        for (const data of dbData) {
            let postId;
            if (data.activity_group_id === groupIdContentCreation) {
                if (data.entity_id_on === null) {
                    throw new Error(`Entity id on is required for the record ${JSON.stringify(data)}. Query is: ${sql}`);
                }
                postId = +data.entity_id_on;
            }
            else {
                postId = +data.entity_id_to;
            }
            if (!posts[postId]) {
                posts[postId] = {
                    repost: false,
                };
            }
            switch (data.activity_group_id) {
                case groupIdContentInteraction:
                    posts[postId].voting = data.activity_type_id;
                    break;
                case groupIdContentCreation:
                    posts[postId].repost = true;
                    break;
                default:
                    throw new Error(`It seems that there is wrong activity_group_id ${data.activity_group_id}. Query was: ${sql}`);
            }
        }
        return posts;
    }
    static async findOneUserBlockchainNodesActivity(userId, blockchainNodesType) {
        const { eventIdUp, eventIdDown } = this.getUpDownEventsByBlockchainNodesType(blockchainNodesType);
        const sql = `
      SELECT entity_id_to FROM (
                  SELECT
                      DISTINCT ON (user_id_from, entity_id_to)
                                  entity_id_to,
                                  event_id
                  FROM
                       ${TABLE_NAME}
                  WHERE
                      user_id_from  = ${+userId}
                      AND entity_name = '${BlockchainModelProvider.getEntityName()}'
                      AND event_id IN (${eventIdUp}, ${eventIdDown})
                  ORDER BY user_id_from, entity_id_to, id DESC
                  ) AS t
        WHERE
          t.event_id = ${eventIdUp};
    `;
        const data = await RepositoryHelper.getKnexRawData(sql);
        return data.map((item) => +item.entity_id_to);
    }
    static async findAllUpvoteUsersBlockchainNodesActivity(blockchainNodesType) {
        const { eventIdUp, eventIdDown } = this.getUpDownEventsByBlockchainNodesType(blockchainNodesType);
        const sql = `
      SELECT id, user_id_from, entity_id_to FROM (
                  SELECT
                      DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
                                  entity_name,
                                  activity_type_id,
                                  entity_id_to,
                                  event_id,
                                  user_id_from,
                                  id
                  FROM
                       ${TABLE_NAME}
                  WHERE
                      event_id IN (${eventIdUp}, ${eventIdDown})
                  ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
                  ) AS I_vote
        WHERE
          event_id = ${eventIdUp};

    `;
        return RepositoryHelper.getKnexRawData(sql);
    }
    static async findAllUpvoteCancelUsersBlockchainNodesActivity(blockchainNodesType) {
        const { eventIdUp, eventIdDown } = this.getUpDownEventsByBlockchainNodesType(blockchainNodesType);
        const sql = `
      SELECT id, user_id_from, entity_id_to FROM (
                  SELECT
                      DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
                                  entity_name,
                                  activity_type_id,
                                  entity_id_to,
                                  event_id,
                                  user_id_from,
                                  id
                  FROM
                       ${TABLE_NAME}
                  WHERE
                      event_id IN (${eventIdUp}, ${eventIdDown})
                  ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
                  ) AS I_vote
        WHERE
          event_id = ${eventIdDown};

    `;
        return RepositoryHelper.getKnexRawData(sql);
    }
    static async setIsSentToBlockchainAndResponse(id, blockchainResponse) {
        const blockchainStatus = blockchainStatusDictionary.getStatusIsSent();
        await this.getModel().update({
            blockchain_status: blockchainStatus,
            blockchain_response: blockchainResponse,
        }, {
            where: { id },
        });
    }
    /**
     *
     * @param {number} id
     * @param {string} entityName
     * @return {Promise<*>}
     */
    static async findOneByIdWithRelatedEntityForIpfs(id, entityName) {
        const relatedTableName = entityName.trim();
        if (relatedTableName !== 'posts') {
            throw new Error(`Only posts entity name is supported now. Provided entity name is ${entityName}`);
        }
        const sql = `
        SELECT rel.id as id, rel.title, rel.leading_text, rel.description, rel.user_id FROM ${TABLE_NAME} as t
          INNER JOIN ${relatedTableName} rel ON rel.id = t.entity_id_to
        WHERE t.id = ${+id}
    `;
        // noinspection JSCheckFunctionSignatures
        const result = await db.query(sql, { type: db.QueryTypes.SELECT });
        return result[0];
    }
    static async getCurrentActivity(activityGroupId, userIdFrom, entityIdTo, entityName) {
        const result = await this.getModel().findOne({
            attributes: ['activity_type_id'],
            where: {
                activity_group_id: activityGroupId,
                user_id_from: userIdFrom,
                entity_id_to: entityIdTo,
                entity_name: entityName,
            },
            order: [
                ['id', 'DESC'],
            ],
            limit: 1,
        });
        return result ? result.activity_type_id : null;
    }
    /**
     *
     * @param {number} id
     * @return {Promise<*>}
     */
    static async getSignedTransactionByActivityId(id) {
        const result = await this.getModel().findOne({
            attributes: ['signed_transaction'],
            where: { id },
            raw: true,
        });
        return result ? result.signed_transaction : null;
    }
    /**
     *
     * @param {number} id
     * @return {Promise<*>}
     */
    static async getUserIdFromByActivityId(id) {
        const result = await this.getModel().findOne({
            attributes: ['user_id_from'],
            where: { id },
            raw: true,
        });
        return result ? +result.user_id_from : null;
    }
    static async findLastWithBlockchainIsSentStatus(userIdFrom) {
        const blockchainStatus = blockchainStatusDictionary.getStatusIsSent();
        return this.getModel().findOne({
            where: {
                user_id_from: userIdFrom,
                blockchain_status: blockchainStatus,
            },
            raw: true,
            limit: 1,
            order: [
                ['id', 'DESC'],
            ],
        });
    }
    static async findLastByEventIdWithBlockchainIsSentStatus(userId, eventId) {
        const blockchainStatus = blockchainStatusDictionary.getStatusIsSent();
        return knex(TABLE_NAME)
            .where({
            user_id_from: userId,
            event_id: eventId,
            blockchain_status: blockchainStatus,
        })
            .orderBy('id', 'desc')
            .limit(1)
            .first();
    }
    static async findLastByEventIdWithBlockchainIsSentStatusById(id) {
        const blockchainStatus = blockchainStatusDictionary.getStatusIsSent();
        return knex(TABLE_NAME)
            .where({
            id,
            blockchain_status: blockchainStatus,
        })
            .first();
    }
    static async findLastByUserIdAndEntityId(userIdFrom, entityIdTo) {
        return this.getModel().findOne({
            where: {
                user_id_from: userIdFrom,
                entity_id_to: entityIdTo,
            },
            raw: true,
            limit: 1,
            order: [
                ['id', 'DESC'],
            ],
        });
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<Object>}
     */
    static async findOneWithPostById(id) {
        const entityTableName = PostsModelProvider.getTableName();
        const entityName = PostsModelProvider.getEntityName();
        const allowedGroups = [
            activityGroupDictionary.getGroupContentCreation(),
            activityGroupDictionary.getGroupContentUpdating(),
            activityGroupDictionary.getGroupContentCreationByOrganization(),
        ];
        return this.findOneWithEntityById(id, entityTableName, entityName, allowedGroups);
    }
    /**
     *
     * @param {number} id
     * @returns {Promise<Object>}
     */
    static async findOneWithCommentById(id) {
        const entityTableName = commentsModelProvider.getTableName();
        const entityName = commentsModelProvider.getEntityName();
        const allowedGroups = [
            activityGroupDictionary.getGroupContentCreation(),
            activityGroupDictionary.getGroupContentCreationByOrganization(),
        ];
        return this.findOneWithEntityById(id, entityTableName, entityName, allowedGroups);
    }
    /**
     *
     * @param {number} id
     * @param {string} entityTableName
     * @param {string} entityName
     * @param {number[]} allowedGroups
     * @returns {Promise<Object|null>}
     */
    static async findOneWithEntityById(id, entityTableName, entityName, allowedGroups) {
        const sql = `
      SELECT
        ${entityTableName}.id AS entity_id,
        ${TABLE_NAME}.entity_name AS entity_name,
        ${entityTableName}.description AS description,
        ${entityTableName}.user_id AS user_id_from,
        ${entityTableName}.organization_id AS org_id
      FROM ${TABLE_NAME}
      INNER JOIN ${entityTableName}
        ON ${entityTableName}.id = ${TABLE_NAME}.entity_id_to
      WHERE ${TABLE_NAME}.id = ${+id}
      AND ${TABLE_NAME}.entity_name = '${entityName}'
      AND ${TABLE_NAME}.activity_group_id IN (${allowedGroups.join(', ')})
    `;
        const res = await db.query(sql, { type: db.QueryTypes.SELECT });
        return res ? res[0] : null;
    }
    /**
     *
     * @param {number} id
     * @return {Promise<Object>}
     */
    static async findOnlyItselfById(id) {
        return this.getModel().findOne({
            where: { id },
            raw: true,
        });
    }
    static async findLastTrustUserActivity(userIdFrom, userIdTo) {
        const where = UsersActivityWhere.getWhereTrustOneUser(userIdFrom, userIdTo);
        return knex(TABLE_NAME)
            .where(where)
            .orderBy('id', 'DESC')
            .limit(1)
            .first();
    }
    static async findLastUntrustUserActivity(userIdFrom, userIdTo) {
        const where = UsersActivityWhere.getWhereUntrustOneUser(userIdFrom, userIdTo);
        return knex(TABLE_NAME)
            .where(where)
            .orderBy('id', 'DESC')
            .limit(1)
            .first();
    }
    static async findLastByUserId(userIdFrom) {
        return this.getModel().findOne({
            where: {
                user_id_from: userIdFrom,
            },
            raw: true,
            limit: 1,
            order: [
                ['id', 'DESC'],
            ],
        });
    }
    static async findEntityRelatedActivityWithInvolvedUsersData(entityId, entityName, activityTypeId, activityGroupId) {
        const sql = `
      SELECT
       "Users".id as id,
       account_name,
       first_name,
       last_name,
       nickname,
       avatar_filename,
       current_rate
    FROM "Users"
       INNER JOIN

(SELECT DISTINCT ON (user_id_from, entity_id_to) activity_type_id, activity_group_id, user_id_from
 FROM users_activity
 WHERE entity_id_to = ${+entityId} AND entity_name = '${entityName}'
ORDER BY user_id_from, entity_id_to, id DESC) as org_activity
    ON org_activity.user_id_from = "Users".id
WHERE activity_type_id = ${activityTypeId} AND activity_group_id = ${activityGroupId};
      `;
        const result = await models.sequelize.query(sql);
        return result ? result[0] : null;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {number} userId
     * @returns {Promise<any>}
     */
    static async findOneUserActivityWithInvolvedUsersData(userId) {
        const activityTypeFollow = ucom_libs_common_1.InteractionTypesDictionary.getFollowId();
        const activityTypeUnfollow = ucom_libs_common_1.InteractionTypesDictionary.getUnfollowId();
        const usersTableName = UsersModelProvider.getUsersTableName();
        const activityTableName = UsersModelProvider.getUsersActivityTableName();
        const activityGroupId = activityGroupDictionary.getGroupUserUserInteraction();
        const entityName = UsersModelProvider.getEntityName();
        const sql = `
      SELECT
        CASE
          WHEN user_id_from   = "${usersTableName}".id THEN 'followed_by'
          WHEN entity_id_to   = "${usersTableName}".id THEN 'I_follow'
        END,
        "${usersTableName}".id as id,
         account_name,
         first_name,
         last_name,
         nickname,
         avatar_filename,
         current_rate
      FROM
        "${usersTableName}"
      INNER JOIN (
        SELECT
          DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
          id,
          activity_type_id,
          user_id_from,
          entity_id_to
        FROM
          ${activityTableName}
        WHERE
          activity_type_id IN (${activityTypeFollow}, ${activityTypeUnfollow})
          AND activity_group_id = ${activityGroupId}
          AND entity_name   = '${entityName}'
          AND (user_id_from = ${+userId} OR entity_id_to = ${+userId})
        ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
      ) AS I_follow
      ON I_follow.user_id_from = "${usersTableName}".id OR I_follow.entity_id_to = "${usersTableName}".id
      WHERE
        "${usersTableName}".id != ${+userId}
        AND activity_type_id = ${activityTypeFollow}
      ORDER BY current_rate DESC;
    `;
        return models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
    }
    /**
     *
     * @param {number} userId
     * @return {Promise<{orgIds: Array, usersIds: Array}>}
     */
    static async findOneUserFollowActivity(userId) {
        const activityTypeFollow = ucom_libs_common_1.InteractionTypesDictionary.getFollowId();
        const activityTypeUnfollow = ucom_libs_common_1.InteractionTypesDictionary.getUnfollowId();
        const activityTableName = UsersModelProvider.getUsersActivityTableName();
        const activityGroupId = activityGroupDictionary.getGroupUserUserInteraction();
        const userEntityName = UsersModelProvider.getEntityName();
        const orgEntityName = OrganizationsModelProvider.getEntityName();
        const orgActivityGroupId = activityGroupDictionary.getGroupContentInteraction();
        const sql = `
      SELECT entity_id_to, entity_name FROM (
                  SELECT
                      DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
                                  entity_name,
                                  activity_type_id,
                                  entity_id_to
                  FROM
                       ${activityTableName}
                  WHERE
                      user_id_from  = ${+userId}
                      AND activity_type_id IN (${activityTypeFollow}, ${activityTypeUnfollow})
                      AND (
                          (activity_group_id = ${+activityGroupId} AND entity_name   = '${userEntityName}')
                        OR
                          (activity_group_id = ${+orgActivityGroupId} AND entity_name   = '${orgEntityName}')
                      )
                  ORDER BY user_id_from, entity_id_to, entity_name, activity_group_id, id DESC
                  ) AS I_follow
        WHERE
          activity_type_id = ${activityTypeFollow};

    `;
        const data = await models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
        const orgIds = [];
        const usersIds = [];
        data.forEach((row) => {
            if (row.entity_name === UsersModelProvider.getEntityName()) {
                usersIds.push(+row.entity_id_to);
            }
            else if (row.entity_name === OrganizationsModelProvider.getEntityName()) {
                orgIds.push(+row.entity_id_to);
            }
        });
        // noinspection JSUnusedGlobalSymbols
        return {
            orgIds,
            usersIds,
        };
    }
    static async doesUserFollowOrg(userId, orgId) {
        const activityTypeFollow = ucom_libs_common_1.InteractionTypesDictionary.getFollowId();
        const activityTypeUnfollow = ucom_libs_common_1.InteractionTypesDictionary.getUnfollowId();
        const activityTableName = UsersModelProvider.getUsersActivityTableName();
        const orgEntityName = OrganizationsModelProvider.getEntityName();
        const orgActivityGroupId = activityGroupDictionary.getGroupContentInteraction();
        const data = await knex(activityTableName)
            .select('activity_type_id')
            .where({
            user_id_from: userId,
            entity_id_to: orgId,
            entity_name: orgEntityName,
            activity_group_id: orgActivityGroupId,
        })
            .andWhereRaw(`activity_type_id IN (${activityTypeFollow}, ${activityTypeUnfollow})`)
            .orderBy('id', 'DESC')
            .limit(1)
            .first();
        return !!data && data.activity_type_id === activityTypeFollow;
    }
    /**
     * #task - use follow index instead
     *
     * @param {number} userId
     * @returns {Promise<any>}
     */
    static async findOneUserFollowActivityData(userId) {
        const entityName = UsersModelProvider.getEntityName();
        const activityGroupId = activityGroupDictionary.getGroupUserUserInteraction();
        const excludeEventIds = [
            ucom_libs_common_1.EventsIdsDictionary.getUserTrustsYou(),
            ucom_libs_common_1.EventsIdsDictionary.getUserUntrustsYou(),
        ];
        const sql = `SELECT
                    DISTINCT ON (user_id_from, entity_id_to, entity_name, activity_group_id)
                    activity_type_id,
                    user_id_from,
                    entity_id_to
                  FROM
                    "${TABLE_NAME}"
                  WHERE
                    entity_name           = '${entityName}'
                    AND activity_group_id = ${activityGroupId}
                    AND event_id NOT IN (${excludeEventIds.join(', ')})
                    AND (
                          user_id_from = ${+userId} OR entity_id_to = ${+userId}
                        )
                  ORDER BY
                    user_id_from, entity_id_to, entity_name, activity_group_id,
                    id DESC
                `;
        return models.sequelize.query(sql, { type: models.sequelize.QueryTypes.SELECT });
    }
    static async getLastFollowActivityForUser(userIdFrom, userIdTo) {
        return this.getModel()
            .findOne({
            where: {
                user_id_from: userIdFrom,
                entity_id_to: userIdTo,
                entity_name: UsersModelProvider.getEntityName(),
                activity_type_id: ucom_libs_common_1.InteractionTypesDictionary.getFollowId(),
                activity_group_id: activityGroupDictionary.getGroupUserUserInteraction(),
            },
            raw: true,
            order: [
                ['id', 'DESC'],
            ],
        });
    }
    /**
     *
     * @param {number} userIdFrom
     * @param {number} userIdTo
     * @returns {Promise<Object>}
     */
    static async getLastUnfollowActivityForUser(userIdFrom, userIdTo) {
        return this.getModel()
            .findOne({
            where: {
                user_id_from: userIdFrom,
                entity_id_to: userIdTo,
                entity_name: UsersModelProvider.getEntityName(),
                activity_type_id: ucom_libs_common_1.InteractionTypesDictionary.getUnfollowId(),
                activity_group_id: activityGroupDictionary.getGroupUserUserInteraction(),
            },
            raw: true,
            order: [
                ['id', 'DESC'],
            ],
        });
    }
    /**
     *
     * @param {number} userIdFrom
     * @param {number} userIdTo
     * @return {Promise<Object>}
     */
    static async getLastFollowOrUnfollowActivityForUser(userIdFrom, userIdTo) {
        const activityTypeFollow = ucom_libs_common_1.InteractionTypesDictionary.getFollowId();
        const activityTypeUnfollow = ucom_libs_common_1.InteractionTypesDictionary.getUnfollowId();
        return this.getModel()
            .findOne({
            where: {
                activity_type_id: {
                    [Op.in]: [activityTypeFollow, activityTypeUnfollow],
                },
                user_id_from: userIdFrom,
                entity_id_to: userIdTo,
                entity_name: UsersModelProvider.getEntityName(),
                activity_group_id: activityGroupDictionary.getGroupUserUserInteraction(),
            },
            raw: true,
            order: [
                ['id', 'DESC'],
            ],
        });
    }
    /**
     *
     * @return {string}
     */
    static getModelName() {
        return TABLE_NAME;
    }
    static getModel() {
        return models[TABLE_NAME];
    }
    static getUpDownEventsByBlockchainNodesType(type) {
        let eventIdUp;
        let eventIdDown;
        switch (type) {
            case Dictionary.BlockchainNodes.typeBlockProducer():
                eventIdUp = ucom_libs_common_1.EventsIdsDictionary.getUserVotesForBlockchainNode();
                eventIdDown = ucom_libs_common_1.EventsIdsDictionary.getUserCancelVoteForBlockchainNode();
                break;
            case Dictionary.BlockchainNodes.typeCalculator():
                eventIdUp = ucom_libs_common_1.EventsIdsDictionary.getUserVotesForCalculatorNode();
                eventIdDown = ucom_libs_common_1.EventsIdsDictionary.getUserCancelVoteForCalculatorNode();
                break;
            default:
                throw new errors_1.AppError(`Unsupported blockchain node type: ${type}`);
        }
        return {
            eventIdUp,
            eventIdDown,
        };
    }
}
module.exports = UsersActivityRepository;
