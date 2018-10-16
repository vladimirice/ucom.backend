const EntityModelProvider = require('../service/entity-model-provider');
const model = EntityModelProvider.getNotificationsModel();

const UsersModelProvider  = require('../../users/service').ModelProvider;
const OrgModelProvider    = require('../../organizations/service').ModelProvider;


const NOTIFICATION_TYPE__PROMPT = 10;
const EVENT_ID__BOARD_INVITATION = 10;

const DOMAIN_ID__USERS_TEAM = 10;


class EntityNotificationsRepository {

  /**
   *
   * @param {number} recipientId
   * @param {number } orgIdToBoard
   * @param {string} title
   * @param {string} description
   * @return {Promise<Object>}
   */
  static async createNewSamplePendingPrompt(recipientId, orgIdToBoard, title, description) {
    const data = {
      title,
      description,
      domain_id: DOMAIN_ID__USERS_TEAM, // mock
      event_id: EVENT_ID__BOARD_INVITATION, // board invitation
      notification_type_id: NOTIFICATION_TYPE__PROMPT,
      recipient_entity_id: recipientId, // user-recipient
      recipient_entity_name: UsersModelProvider.getEntityName(),
      entity_id: orgIdToBoard,
      entity_name: OrgModelProvider.getEntityName(),
    };

    return await model.create(data);
  }

  /**
   *
   * @param {number} id
   * @param {number} confirmed
   * @param {boolean} finished
   * @param {boolean} seen
   * @return {Promise<Object>}
   */
  static async setNotificationStatus(id, confirmed, finished, seen) {
    const data = {
      confirmed,
      finished,
      seen
    };

    const where = {
      id
    };

    return await model.update(data, { where });
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

    const order = [
      ['finished', 'ASC'],
      ['created_at', 'DESC']
    ];

    const data = await model.findAll({
      attributes,
      where,
      order
    });

    return data.map((item) => {
      return item.toJSON();
    });
  }
}

module.exports = EntityNotificationsRepository;