const EntityModelProvider = require('../service/entity-model-provider');
const model = EntityModelProvider.getNotificationsModel();

const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;

const NOTIFICATION_TYPE__PROMPT = 10;
const NOTIFICATION_TYPE__ALERT  = 11;
const EVENT_ID__BOARD_INVITATION = 10;
const DOMAIN_ID__USERS_TEAM = 10;

class EntityNotificationsRepository {
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
   *
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
   * @return {Promise<Object[]>}
   */
  static async findAllByUserRecipientId(userId) {
    const recipient_entity_name = UsersModelProvider.getEntityName();
    const recipient_entity_id   = userId;

    const attributes = model.getRequiredFields();

    const where = {
      recipient_entity_name,
      recipient_entity_id
    };

    // TODO - temp solution
    const include = [
      OrgModelProvider.getIncludeForPreview(),
    ];

    const order = [
      ['finished', 'ASC'],
      ['created_at', 'DESC']
    ];

    const data = await model.findAll({
      attributes,
      include,
      where,
      order
    });

    return data.map((item) => {
      return item.toJSON();
    });
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