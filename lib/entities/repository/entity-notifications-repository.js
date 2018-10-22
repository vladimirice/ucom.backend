const EntityModelProvider = require('../service/entity-model-provider');
const model = EntityModelProvider.getNotificationsModel();

const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const QueryFilterService = require('../../api/filters/query-filter-service');

const _ = require('lodash');

const NOTIFICATION_TYPE__PROMPT = 10;
const NOTIFICATION_TYPE__ALERT  = 11;
const EVENT_ID__BOARD_INVITATION = 10;
const DOMAIN_ID__USERS_TEAM = 10;


class EntityNotificationsRepository {
  /**
   *
   * @param {number[]} usersIds
   * @param {number } orgId
   * @param {Object|null} transaction
   * @return {Promise<Object>}
   */
  static async createOrgBoardInvitationForUsers(usersIds, orgId, transaction = null) {
    let data = [];

    usersIds.forEach(userId => {
      data.push({
        title:                  '',
        description:            '',
        domain_id:              DOMAIN_ID__USERS_TEAM,
        event_id:               EVENT_ID__BOARD_INVITATION,
        notification_type_id:   NOTIFICATION_TYPE__PROMPT,
        recipient_entity_id:    userId,
        recipient_entity_name:  UsersModelProvider.getEntityName(),
        entity_id:              orgId,
        entity_name:            OrgModelProvider.getEntityName(),
      });
    });

    return model.bulkCreate(data, { transaction });
  }

  /**
   *
   * @param {number} recipientId
   * @param {number } orgIdToBoard
   * @param {Object|null} transaction
   * @return {Promise<Object>}
   */
  static async createUsersTeamInvitationPrompt(recipientId, orgIdToBoard, transaction = null) {
    const data = {
      title:                  '',
      description:            '',
      domain_id:              DOMAIN_ID__USERS_TEAM,
      event_id:               EVENT_ID__BOARD_INVITATION,
      notification_type_id:   NOTIFICATION_TYPE__PROMPT,
      recipient_entity_id:    recipientId,
      recipient_entity_name:  UsersModelProvider.getEntityName(),
      entity_id:              orgIdToBoard,
      entity_name:            OrgModelProvider.getEntityName(),
    };

    return await model.create(data, { transaction });
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

    const data = await model.findAll(params);

    return data.map((item) => {
      return item.toJSON();
    });
  }

  static _getIncludeForList() {
    return [
      OrgModelProvider.getIncludeForPreview()
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