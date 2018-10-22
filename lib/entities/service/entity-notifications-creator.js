const SocketIoServer = require('../../../lib/websockets/socket-io-server');
const EntityNotificationRepository = require('../../entities/repository').Notifications;

const EVENT_NAME__NOTIFICATION = 'notification';

class EntityNotificationsCreator {

  /**
   *
   * @param {number[]} usersIds
   * @param {number} orgId
   * @param {Object} transaction
   * @return {Promise<void>}
   */
  static async processOrgBoardInvitationForUsers(usersIds, orgId, transaction) {
    return EntityNotificationRepository.createOrgBoardInvitationForUsers(usersIds, orgId, transaction);
  }

  /**
   *
   * @param {number[]} usersIds
   * @return {Promise<void>}
   */
  static async sendUnreadMessagesNotificationsViaSockets(usersIds) {
    for (let i = 0; i < usersIds.length; i++) {
      const userId = usersIds[i];

      // TODO #db - fetch all unread messages count for all users in one request
      const unread_messages_count = await EntityNotificationRepository.countUnreadMessages(userId);

      const payload = {
        unread_messages_count
      };

      SocketIoServer.emitToUser(userId, EVENT_NAME__NOTIFICATION, payload);
    }
  }
}

module.exports = EntityNotificationsCreator;