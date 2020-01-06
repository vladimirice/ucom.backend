"use strict";
const entityModelProvider = require('../service/entity-model-provider');
const model = entityModelProvider.getNotificationsModel();
const usersModelProvider = require('../../users/service').ModelProvider;
const orgModelProvider = require('../../organizations/service').ModelProvider;
// eslint-disable-next-line import/order
const _ = require('lodash');
class EntityNotificationsRepository {
    /**
     *
     * @param {number} eventId
     * @param {number} recipientId
     * @param {number} activityId
     * @param {string} jsonBody
     * @return {Promise<data>}
     */
    static async createNewNotification(eventId, recipientId, activityId, jsonBody) {
        const data = {
            event_id: eventId,
            recipient_entity_id: recipientId,
            recipient_entity_name: usersModelProvider.getEntityName(),
            users_activity_id: activityId,
            json_body: jsonBody,
            // not required fields, should be deleted in future
            user_id_from: 0,
            domain_id: 0,
            title: '',
            description: '',
            notification_type_id: 0,
            entity_id: 0,
            entity_name: '',
            target_entity_id: 0,
            target_entity_name: '',
        };
        return model.create(data);
    }
    /**
     * prompt only case without SEEN feature. For prompt finished === seen
     * @param {number} recipientId
     * @return {Promise<number>}
     */
    static async countUnreadMessages(recipientId) {
        const where = {
            recipient_entity_id: recipientId,
            finished: false,
        };
        return model.count({
            where,
        });
    }
    /**
     * Only for autotests
     * @param {number} id
     * @return {Promise<Object>}
     */
    static async findNotificationItselfById(id) {
        return model.findOne({
            where: {
                id,
            },
            raw: true,
        });
    }
    /**
     *
     * @param {number} id
     * @param {number} confirmed
     * @param {boolean} finished
     * @param {boolean} seen
     * @param {Object|null} transaction
     * @return {Promise<Object>}
     */
    static async setNotificationStatus(id, confirmed, finished, seen, transaction = null) {
        const data = {
            confirmed,
            finished,
            seen,
        };
        const where = {
            id,
        };
        return model.update(data, { where, transaction });
    }
    /**
     *
     * @param {number} id
     * @return {Promise<*>}
     */
    static async setStatusSeenAndFinished(id) {
        const data = {
            finished: true,
            seen: true,
        };
        const where = { id };
        return model.update(data, { where });
    }
    /**
     *
     * @param {number} id
     * @return {Promise<*>}
     */
    static async setStatusSeen(id) {
        const data = {
            seen: true,
        };
        const where = { id };
        return model.update(data, { where });
    }
    /**
     *
     * @param {number} userId
     * @param {boolean} order
     * @return {Promise<Object[]>}
     */
    static async findAllUserNotificationsItselfByUserId(userId, order = true) {
        const params = {};
        this.andWhereRecipientIsUser(userId, params);
        if (order) {
            params.order = this.getOrderByDefault();
        }
        const data = await model.findAll(params);
        return data.map(item => item.toJSON());
    }
    /**
     *
     * @param {number} userId
     * @param {Object} params
     * @return {void}
     * @private
     */
    static andWhereRecipientIsUser(userId, params) {
        if (!params.where) {
            params.where = {};
        }
        params.where.recipient_entity_name = usersModelProvider.getEntityName();
        params.where.recipient_entity_id = userId;
    }
    /**
     *
     * @return {string[][]}
     */
    static getOrderByDefault() {
        return [
            ['finished', 'ASC'],
            ['id', 'DESC'],
        ];
    }
    /**
     *
     * @return {{limit: number, offset: number, order: string[][]}}
     */
    static getNotificationsDefaultListParams() {
        return {
            limit: 10,
            offset: 0,
            order: this.getOrderByDefault(),
            raw: true,
        };
    }
    /**
     *
     * @param {number} userId
     * @param {Object} givenParams
     * @return {Promise<Object[]>}
     */
    static async findAllNotificationsListByUserId(userId, givenParams = {}) {
        this.andWhereRecipientIsUser(userId, givenParams);
        return this.findAllNotificationsByParams(givenParams);
    }
    /**
     *
     * @param {number} id
     * @param {number} userId
     * @return {Promise<any[]>}
     */
    static async findOneByRecipientIdAndId(id, userId) {
        const params = {
            where: {
                id,
                recipient_entity_id: userId,
            },
        };
        const res = await this.findAllNotificationsByParams(params);
        return res[0];
    }
    /**
     *
     * @param {Object} givenParams
     * @return {Promise<Object[]>}
     */
    static async findAllNotificationsByParams(givenParams = {}) {
        const params = _.defaults(givenParams, this.getNotificationsDefaultListParams());
        params.attributes = entityModelProvider.getNotificationsRequiredFieldsToProcess();
        return model.findAll(params);
    }
    /**
     *
     * @param {number} userId
     * @return {Promise<Object[]>}
     */
    static async countAllByUserRecipientId(userId) {
        const params = {};
        this.andWhereRecipientIsUser(userId, params);
        return model.count(params);
    }
    // @ts-ignore
    static getIncludeForList() {
        return [
            orgModelProvider.getIncludeForPreview(),
            usersModelProvider.getIncludeAuthorForPreview(),
        ];
    }
}
module.exports = EntityNotificationsRepository;
