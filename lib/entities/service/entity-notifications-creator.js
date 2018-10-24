const SocketIoServer = require('../../../lib/websockets/socket-io-server');
const EntityNotificationRepository = require('../../entities/repository').Notifications;
const UsersActivityRepository = require('../../users/repository').Activity;
const { InteractionTypeDictionary } = require('uos-app-transaction');
const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');

const EVENT_NAME__NOTIFICATION = 'notification';

class EntityNotificationsCreator {

  static async processJob(message) {
    if (!message.id) {
      throw new Error(`Malformed message. ID is required. Message is: ${JSON.stringify(message)}`);
    }

    const activity = await UsersActivityRepository.findOnlyItselfById(+message.id);

    if (!activity) {
      throw new Error(`There is no activity with the ID ${message.id}`);
    }

    switch (activity.activity_type_id) {
      case InteractionTypeDictionary.getOrgTeamInvitation():
        await EntityNotificationRepository.createOrgBoardInvitationForOneUser(
          activity.entity_id_to,
          activity.entity_id_on,
          activity.id
        );

        console.log('Notification is created');
        break;
      case InteractionTypeDictionary.getFollowId():
        if (activity.activity_group_id === ActivityGroupDictionary.getGroupUserUserInteraction()) {
          await EntityNotificationRepository.createUserFollowsOtherUser(
            activity.user_id_from,
            activity.entity_id_to,
            activity.id
          );
        }
        break;
      default:
        console.warn(`No rule to process notification for activity_type_id: ${activity.activity_type_id}. Entity ID is: ${activity.id}`);
    }

    // TODO - send notification via socketIO
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