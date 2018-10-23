const EntityModelProvider = require('../service/entity-model-provider');
const model = EntityModelProvider.getNotificationsModel();

const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const EventIdDictionary = require('../../entities/dictionary').EventId;

const _ = require('lodash');

const DOMAIN_ID__USERS_TEAM = 10;

class EntityNotificationsRepository {
  /**
   *
   * @param {number} userId
   * @param {number} orgId
   * @param {number} activityId
   * @param {Object|null} transaction
   * @return {Promise<Object>}
   */
  static async createOrgBoardInvitationForOneUser(userId, orgId, activityId, transaction = null) {
    const data = {
        title:                  '',
        description:            '',
        domain_id:              DOMAIN_ID__USERS_TEAM,
        event_id:               EventIdDictionary.getOrgUsersTeamInvitation(),
        notification_type_id:   0,

        recipient_entity_id:    userId,
        recipient_entity_name:  UsersModelProvider.getEntityName(),

        entity_id:              orgId,
        entity_name:            OrgModelProvider.getEntityName(),

        target_entity_id:       userId,
        target_entity_name:     UsersModelProvider.getEntityName(),
        users_activity_id:      activityId
      };

    return model.create(data, { transaction });
  }

  /**
   * TODO - prompt only case without SEEN feature. For prompt finished === seen
   * @param {number} recipientId
   * @return {Promise<number>}
   */
  static async countUnreadMessages(recipientId) {
    const where = {
      recipient_entity_id:  recipientId,
      finished:             false,
    };

    return await model.count({
      where
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
      seen
    };

    const where = {
      id
    };

    return await model.update(data, { where, transaction});
  }

  /**
   *
   * @param {number} userId
   * @param {boolean} order
   * @return {Promise<Object[]>}
   */
  static async findAllUserNotificationsItselfByUserId(userId, order = true) {
    let params = {};
    this._andWhereRecipientIsUser(userId, params);

    if (order) {
      params.order = this.getOrderByDefault();
    }

    const data = await model.findAll(params);

    return data.map((item) => {
      return item.toJSON();
    });
  }

  /**
   *
   * @param {number} userId
   * @param {Object} params
   * @return {void}
   * @private
   */
  static _andWhereRecipientIsUser(userId, params) {
    if (!params.where) {
      params.where = {};
    }

    params.where.recipient_entity_name  = UsersModelProvider.getEntityName();
    params.where.recipient_entity_id    = userId;
  }

  /**
   *
   * @return {string[][]}
   */
  static getOrderByDefault() {
    return [
      ['finished', 'ASC'],
      ['id', 'DESC'],
    ]
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
    }
  }

  /**
   *
   * @param {number} userId
   * @param {Object} givenParams
   * @return {Promise<Object[]>}
   */
  static async findAllNotificationsListByUserId(userId, givenParams = {}) {
    this._andWhereRecipientIsUser(userId, givenParams);

    return await this.findAllNotificationsByParams(givenParams);
  }

  /**
   *
   * @param {Object} givenParams
   * @return {Promise<Object[]>}
   */
  static async findAllNotificationsByParams(givenParams = {}) {
    const params = _.defaults(givenParams, this.getNotificationsDefaultListParams());

    params.attributes = model.getRequiredFields();

    // TODO - temp solution, not always org for notifications
    params.include = this._getIncludeForList();

    // Determine relation name and fetch it based on notification type

    // 1 - SQL creation probably with knex as query builder
    // because there is no direct rule for notifications so how to fetch all required notifications fields without knex

    // HOW TO join to different types

    /*

    SELECT * FROM notifications
      LEFT JOIN users ON user_id = 123 AND event_id = 'users' // JOIN to receive user




     */



    const data = await model.findAll(params);

    return data.map((item) => {
      return item.toJSON();
    });
  }

  static _getIncludeForList() {
    return [
      OrgModelProvider.getIncludeForPreview(),
      UsersModelProvider.getIncludeAuthorForPreview()
    ]
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<Object[]>}
   */
  static async countAllByUserRecipientId(userId) {
    let params = {};

    this._andWhereRecipientIsUser(userId, params);

    return await model.count(params);
  }

  /**
   *
   * @param {number} id
   * @param {number} userId
   * @return {Promise<any[]>}
   */
  static async findOneByRecipientIdAndId(id, userId) {
    const recipient_entity_name = UsersModelProvider.getEntityName();
    const recipient_entity_id   = userId;

    const attributes = model.getRequiredFields();

    const where = {
      id,
      recipient_entity_name,
      recipient_entity_id
    };

    // TODO - temp solution
    const include = [
      OrgModelProvider.getIncludeForPreview(),
      UsersModelProvider.getIncludeAuthorForPreview(),
    ];

    const data = await model.findOne({
      attributes,
      include,
      where,
    });

    return data.toJSON();
  }
}

module.exports = EntityNotificationsRepository;