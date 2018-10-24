const EntityModelProvider = require('../service/entity-model-provider');
const model = EntityModelProvider.getNotificationsModel();

const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const EventIdDictionary = require('../../entities/dictionary').EventId;

const _ = require('lodash');

const db = require('../../../models').sequelize;

const DOMAIN_ID__USERS_TEAM = 10;
const DOMAIN_ID__USER_TO_USER = 30;

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
   *
   * @param {number} whoIsFollowedId
   * @param {number} whoActsId
   * @param {number} activityId
   * @param {Object|null} transaction
   * @return {Promise<data>}
   */
  static async createUserFollowsOtherUser(whoActsId, whoIsFollowedId, activityId, transaction = null) {
    const data = {

      domain_id:              DOMAIN_ID__USER_TO_USER,
      event_id:               EventIdDictionary.getUserFollowsYou(),

      recipient_entity_id:    whoIsFollowedId,
      recipient_entity_name:  UsersModelProvider.getEntityName(),

      entity_id:              whoActsId,
      entity_name:            UsersModelProvider.getEntityName(),

      target_entity_id:       whoIsFollowedId,
      target_entity_name:     UsersModelProvider.getEntityName(),

      users_activity_id:      activityId,

      // not required fields, should be deleted in future
      title:                  '',
      description:            '',
      notification_type_id:   0,
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
   * @param {number} id
   * @param {number} userId
   * @return {Promise<any[]>}
   */
  static async findOneByRecipientIdAndId(id, userId) {
    const params = {
      where: {
        id,
        recipient_entity_id: userId,
      }
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

    const selectString = this._getAttributesToSelectForList();

    let sql = `
      SELECT
        ${selectString}
      FROM entity_notifications en

        -- who acts
        LEFT JOIN organizations org_which_acts 
          ON en.entity_id = org_which_acts.id 
          AND en.entity_name = 'org       ' 
          AND en.recipient_entity_id = ${+params.where.recipient_entity_id}
        LEFT JOIN "Users" user_who_acts 
          ON en.entity_id = user_who_acts.id 
          AND en.entity_name = 'users     '
          AND en.recipient_entity_id = ${+params.where.recipient_entity_id}
          
        -- target entity, subject of action
      WHERE en.recipient_entity_id = ${+params.where.recipient_entity_id}
    `;

    sql = this._addPartsFromParams(sql, params);

    const dbData = await db.query(sql, { type: db.QueryTypes.SELECT });

    return this._arrangeResponse(dbData);
  }

  /**
   *
   * @return {string}
   * @private
   */
  static _getAttributesToSelectForList() {
    const toSelect = [];

    const notificationsAttributes = model.getRequiredFields();
    notificationsAttributes.forEach(attribute => {
      toSelect.push(`en.${attribute} AS entity_notifications__${attribute}`)
    });

    const usersAttributes = UsersModelProvider.getUserFieldsForPreview();
    usersAttributes.forEach(attribute => {
      toSelect.push(`user_who_acts.${attribute} AS user_who_acts__${attribute}`)
    });

    const orgAttributes = OrgModelProvider.getOrgFieldsForPreview();
    orgAttributes.forEach(attribute => {
      toSelect.push(`org_which_acts.${attribute} AS org_which_acts__${attribute}`)
    });

    return toSelect.join(', ');
  }


  /**
   *
   * @param {string} sql
   * @param {Object} params
   * @return {string}
   * @private
   */
  static _addPartsFromParams(sql, params) {
    if (params.where.id) {
      sql += ` AND en.id = ${+params.where.id}`;
    }

    if (params.order) {
      const orderArray = [];

      params.order.forEach((set) => {
        orderArray.push(`en.${set[0]} ${set[1]}`);
      });

      sql += ` ORDER BY ${orderArray.join(', ')}`;
    }

    if (params.offset) {
      sql += ` OFFSET ${+params.offset}`
    }

    if (params.limit) {
      sql += ` LIMIT ${+params.limit}`
    }

    return sql;
  }

  /**
   *
   * @param {Object[]} dbData
   * @return {Object[]}
   * @private
   */
  static _arrangeResponse(dbData) {
    const packed = [];

    for (let i = 0; i < dbData.length; i++) {
      const notification = dbData[i];

      const packedOne = {
        data: {},
      };

      let keyFromDb = '';
      let keyForData = '';

      switch(notification.entity_notifications__event_id) {
        case EventIdDictionary.getOrgUsersTeamInvitation():
          keyFromDb = 'org_which_acts__';
          keyForData = 'organization';
          break;
        case EventIdDictionary.getUserFollowsYou():
          keyFromDb = 'user_who_acts__';
          keyForData = 'User';
          break;
        default:
          throw new Error(`Unsupported event id: ${notification.entity_notifications__event_id}`);
      }

      packedOne.data[keyForData] = {};

      for (const field in notification) {
        if (field.includes('entity_notifications__')) {
          packedOne[field.replace('entity_notifications__', '')] = notification[field];

          continue;
        }

        if (field.includes(keyFromDb)) {
          const fieldName = field.replace(keyFromDb, '');
          packedOne.data[keyForData][fieldName] = notification[field];
        }
      }

      packed.push(packedOne);
    }

    return packed;
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
}

module.exports = EntityNotificationsRepository;