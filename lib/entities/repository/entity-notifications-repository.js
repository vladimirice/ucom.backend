const EntityModelProvider = require('../service/entity-model-provider');
const model = EntityModelProvider.getNotificationsModel();

const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const EventIdDictionary = require('../../entities/dictionary').EventId;

const _ = require('lodash');

const DOMAIN_ID__USERS_TEAM = 10;
const DOMAIN_ID__USER_TO_USER = 30;
const DOMAIN_ID__USER_TO_ORG = 50;

const DOMAIN_ID__USER_TO_POST = 70;
const DOMAIN_ID__USER_TO_COMMENT = 80;


class EntityNotificationsRepository {

  /**
   * @param {Object} activity
   * @param {number} orgMemberIdToReceive
   * @param {Object} jsonBody
   * @return {Promise<data>}
   */
  static async createUserFollowsOrg(activity, orgMemberIdToReceive, jsonBody) {
    const data = {

      domain_id:              DOMAIN_ID__USER_TO_ORG,
      event_id:               EventIdDictionary.getUserFollowsOrg(),

      recipient_entity_id:    orgMemberIdToReceive,
      recipient_entity_name:  UsersModelProvider.getEntityName(),

      entity_id:              activity.user_id_from,
      entity_name:            UsersModelProvider.getEntityName(),

      target_entity_id:       activity.entity_id_to,
      target_entity_name:     OrgModelProvider.getEntityName(),

      users_activity_id:      activity.id,
      user_id_from:           activity.user_id_from,
      json_body:              jsonBody,

      // not required fields, should be deleted in future
      title:                  '',
      description:            '',
      notification_type_id:   0,
    };

    console.log('data to save is');
    console.dir(data);

    return model.create(data);
  }


  /**
   * @param {Object} activity
   * @param {Object} jsonBody
   * @return {Promise<data>}
   */
  static async createUserFollowsOtherUser(activity, jsonBody) {
    const data = {

      domain_id:              DOMAIN_ID__USER_TO_USER,
      event_id:               EventIdDictionary.getUserFollowsYou(),

      recipient_entity_id:    activity.entity_id_to,
      recipient_entity_name:  UsersModelProvider.getEntityName(),

      entity_id:              activity.user_id_from,
      entity_name:            UsersModelProvider.getEntityName(),

      target_entity_id:       activity.entity_id_to,
      target_entity_name:     UsersModelProvider.getEntityName(),

      users_activity_id:      activity.id,
      user_id_from:           activity.user_id_from,
      json_body:              jsonBody,

      // not required fields, should be deleted in future
      title:                  '',
      description:            '',
      notification_type_id:   0,
    };

    return model.create(data);
  }

  /**
   * @param {Object} activity
   * @param {number} recipientId
   * @param {Object} jsonBody
   * @return {Promise<data>}
   */
  static async createUserCreatesCommentForPost(activity, recipientId, jsonBody) {
    const data = {

      domain_id:              DOMAIN_ID__USER_TO_POST,
      event_id:               EventIdDictionary.getUserCommentsPost(),

      recipient_entity_id:    recipientId,
      recipient_entity_name:  UsersModelProvider.getEntityName(),

      users_activity_id:      activity.id,
      user_id_from:           activity.user_id_from,
      json_body:              jsonBody,

      // not required fields, should be deleted in future
      title:                  '',
      description:            '',
      notification_type_id:   0,

      entity_id:              0,
      entity_name:            '',

      target_entity_id:       0,
      target_entity_name:     '',
    };

    return model.create(data);
  }

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
      event_id:               eventId,

      recipient_entity_id:    recipientId,
      recipient_entity_name:  UsersModelProvider.getEntityName(),

      users_activity_id:      activityId,
      json_body:              jsonBody,

      // not required fields, should be deleted in future
      user_id_from:           1,
      domain_id:              DOMAIN_ID__USER_TO_POST,
      title:                  '',
      description:            '',
      notification_type_id:   0,

      entity_id:              0,
      entity_name:            '',

      target_entity_id:       0,
      target_entity_name:     '',
    };

    return model.create(data);
  }

  /**
   * @param {Object} activity
   * @param {number} recipientId
   * @param {Object} jsonBody
   * @return {Promise<data>}
   */
  static async createUserCreatesCommentForOrgPost(activity, recipientId, jsonBody) {
    const data = {


      event_id:               EventIdDictionary.getUserCommentsOrgPost(),

      recipient_entity_id:    recipientId,
      recipient_entity_name:  UsersModelProvider.getEntityName(),

      users_activity_id:      activity.id,
      user_id_from:           activity.user_id_from,
      json_body:              jsonBody,

      // not required fields, should be deleted in future

      domain_id:              DOMAIN_ID__USER_TO_POST,
      title:                  '',
      description:            '',
      notification_type_id:   0,

      entity_id:              0,
      entity_name:            '',

      target_entity_id:       0,
      target_entity_name:     '',
    };

    return model.create(data);
  }

  /**
   * @param {Object} activity
   * @param {number} recipientId
   * @param {Object} jsonBody
   * @return {Promise<data>}
   */
  static async createUserCreatesCommentForComment(activity, recipientId, jsonBody) {
    const data = {
      event_id:               EventIdDictionary.getUserCommentsComment(),

      recipient_entity_id:    recipientId,
      recipient_entity_name:  UsersModelProvider.getEntityName(),

      users_activity_id:      activity.id,
      json_body:              jsonBody,

      // not required fields, should be deleted in future
      user_id_from:           activity.user_id_from,
      domain_id:              0,
      title:                  '',
      description:            '',
      notification_type_id:   0,

      entity_id:              0,
      entity_name:            '',

      target_entity_id:       0,
      target_entity_name:     '',
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
      recipient_entity_id:  recipientId,
      finished:             false,
    };

    return await model.count({
      where
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
        id
      },
      raw: true
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
   * @param {number} id
   * @return {Promise<*>}
   */
  static async setStatusSeenAndFinished(id) {
    const data = {
      finished: true,
      seen:     true
    };

    const where = { id };

    return await model.update(data, { where });
  }

  /**
   *
   * @param {number} id
   * @return {Promise<*>}
   */
  static async setStatusSeen(id) {
    const data = {
      seen: true
    };

    const where = { id };

    return await model.update(data, { where });
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
      raw: true,
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
   * @param {Object} activity
   * @param {string} jsonBody
   * @return {Promise<Object>}
   */
  static async createOrgBoardInvitationForOneUser(activity, jsonBody) {
    const data = {
      title:                  '',
      description:            '',
      domain_id:              DOMAIN_ID__USERS_TEAM,
      event_id:               EventIdDictionary.getOrgUsersTeamInvitation(),
      notification_type_id:   0,

      recipient_entity_id:    activity.entity_id_to,
      recipient_entity_name:  UsersModelProvider.getEntityName(),

      entity_id:              activity.entity_id_on,
      entity_name:            OrgModelProvider.getEntityName(),

      target_entity_id:       activity.entity_id_to,
      target_entity_name:     UsersModelProvider.getEntityName(),
      users_activity_id:      activity.id,

      user_id_from:           activity.user_id_from,
      json_body:              jsonBody,
    };

    return model.create(data);
  }


  /**
   *
   * @param {Object} givenParams
   * @return {Promise<Object[]>}
   */
  static async findAllNotificationsByParams(givenParams = {}) {
    const params = _.defaults(givenParams, this.getNotificationsDefaultListParams());
    params.attributes = EntityModelProvider.getNotificationsRequiredFieldsToProcess();

    return await model.findAll(params);


    // let sql = `
    //   SELECT
    //     ${selectString}
    //   FROM entity_notifications en
    //
    //     -- who acts
    //     LEFT JOIN organizations org_which_acts
    //       ON en.entity_id = org_which_acts.id
    //       AND en.entity_name = 'org       '
    //       AND en.recipient_entity_id = ${+params.where.recipient_entity_id}
    //     LEFT JOIN "Users" user_who_acts
    //       ON en.entity_id = user_who_acts.id
    //       AND en.entity_name = 'users     '
    //       AND en.recipient_entity_id = ${+params.where.recipient_entity_id}
    //     LEFT JOIN "Users" user_actor
    //       ON en.user_id_from = user_actor.id
    //       AND en.recipient_entity_id = ${+params.where.recipient_entity_id}
    //     LEFT JOIN organizations org_is_target
    //       ON en.target_entity_id = org_is_target.id
    //       AND en.target_entity_name = 'org       '
    //       AND en.recipient_entity_id = ${+params.where.recipient_entity_id}
    //
    //     -- target entity, subject of action
    //   WHERE en.recipient_entity_id = ${+params.where.recipient_entity_id}
    // `;
    //
    // sql = this._addPartsFromParams(sql, params);

    // const dbData = await db.query(sql, { type: db.QueryTypes.SELECT });
    //
    // return this._arrangeResponse(dbData);

    // TODO - for every entity an author or actor is required. Maybe better to place actor to notifications
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