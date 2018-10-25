const SocketIoServer = require('../../../lib/websockets/socket-io-server');

const EntityNotificationRepository      = require('../../entities/repository').Notifications;
const ActivityToNotificationRepository  = require('../../users/repository').ActivityToNotification;
const UsersActivityRepository           = require('../../users/repository').Activity;


const { InteractionTypeDictionary, ContentTypeDictionary } = require('uos-app-transaction');
const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');

const ApiPostProcessor = require('../../common/service').PostProcessor;

const EVENT_NAME__NOTIFICATION = 'notification';

class EntityNotificationsCreator {
//
  static async processJob(message) {
    if (!message.id) {
      throw new Error(`Malformed message. ID is required. Message is: ${JSON.stringify(message)}`);
    }

    const activity = await UsersActivityRepository.findOnlyItselfById(+message.id);
    if (!activity) {
      throw new Error(`There is no activity with the ID ${message.id}`);
    }

    await this._createNotificationByActivity(activity);
    // TODO - send notification via socketIO
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  static async _createNotificationByActivity(activity) {
    switch (activity.activity_type_id) {
      case InteractionTypeDictionary.getOrgTeamInvitation():
        await this._createOrgBoardInvitation(activity);
        break;
      case InteractionTypeDictionary.getFollowId():
        await this._createUserFollows(activity);
        break;
      case ContentTypeDictionary.getTypeComment():
        await this._userCreatesCommentForPost(activity);
        break;
      default:
        console.warn(`No rule to process notification for activity_type_id: ${activity.activity_type_id}. Entity ID is: ${activity.id}`);
    }
  }

  static async _userCreatesCommentForPost(activity) {
    switch(activity.activity_group_id) {
      case ActivityGroupDictionary.getGroupContentCreation():
        {
          const dbData = await ActivityToNotificationRepository.findForUserCreatesCommentForPost(activity.id);
          ApiPostProcessor.processUserCreatesCommentForPost(dbData);

          const recipientId = dbData.target_entity.post.User.id;

          await EntityNotificationRepository.createUserCreatesCommentForPost(activity, recipientId, dbData);
        }
        break;
      default:
        console.warn(`No rule to process notification for activity_type_id: ${activity.activity_type_id}. Entity ID is: ${activity.id}`)
    }
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<Object>}
   * @private
   */
  static async _createOrgBoardInvitation(activity) {
    const dbData = await ActivityToNotificationRepository.findForOrgTeamInvitation(activity.id);

    ApiPostProcessor.processOneOrgUsersTeamInvitation(dbData);
    // const jsonBody = JSON.stringify(dbData);

    return EntityNotificationRepository.createOrgBoardInvitationForOneUser(activity, dbData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  static async _createUserFollows(activity) {
    switch (activity.activity_group_id) {
      case ActivityGroupDictionary.getGroupUserUserInteraction():
        {
          const dbData = await ActivityToNotificationRepository.findForUserFollowsOtherUser(activity.id);
          ApiPostProcessor.processOneUserFollowsOtherUserNotification(dbData);
          await EntityNotificationRepository.createUserFollowsOtherUser(activity, dbData);
        }

        break;
      case ActivityGroupDictionary.getGroupContentInteraction():
      {
        const dbData = await ActivityToNotificationRepository.findForUserFollowsOrgNotification(activity.id);
        ApiPostProcessor.processOneUserFollowsOrgNotification(dbData);
        const recipientId = dbData.target_entity.organization.user_id;
        await EntityNotificationRepository.createUserFollowsOrg(activity, recipientId, dbData);
      }
        break;
      default:
        console.warn(`No rule to process notification for activity_type_id: ${activity.activity_type_id}. Entity ID is: ${activity.id}`);
    }
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