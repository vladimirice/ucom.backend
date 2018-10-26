const SocketIoServer = require('../../../lib/websockets/socket-io-server');

const EntityNotificationRepository      = require('../../entities/repository').Notifications;
const ActivityToNotificationRepository  = require('../../users/repository').ActivityToNotification;
const UsersActivityRepository           = require('../../users/repository').Activity;

const PostsRepository = require('../../posts/repository').Main;

const { InteractionTypeDictionary, ContentTypeDictionary } = require('uos-app-transaction');
const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');

const ApiPostProcessor = require('../../common/service').PostProcessor;

const PostsModelProvider    = require('../../posts/service').ModelProvider;
const CommentsModelProvider = require('../../comments/service').ModelProvider;

const EventIdDictionary = require('../../../lib/entities/dictionary').EventId;

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

    const notification = await this._workWithEventId(activity);

    if (!notification) {
      // Old code - required to refactor this
      await this._createNotificationByActivity(activity);
    }
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
        if (activity.entity_name_on === PostsModelProvider.getEntityName()) {
          await this._userCreatesCommentForPost(activity);
        } else if (activity.entity_name_on === CommentsModelProvider.getEntityName()) {
          await this._userCreatesCommentForComment(activity);
        } else {
          this._logNotProcessed(activity);
        }
        break;
      default:
        this._logNotProcessed(activity);
    }
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<Object|null>}
   * @private
   */
  static async _workWithEventId(activity) {
    switch(activity.event_id) {
      case EventIdDictionary.getUserCommentsOrgPost():
        return this._processUserCommentsOrgPost(activity);
      case EventIdDictionary.getUserCommentsOrgComment():
        return this._processUserCommentsOrgComment(activity);
      default:
        return null;
    }
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _processUserCommentsOrgPost(activity) {
    const jsonBody = await ActivityToNotificationRepository.findForUserCreatesCommentForOrgPost(activity.id);

    console.dir(jsonBody);

    const recipientId = jsonBody.target_entity.post.organization.user_id;
    ApiPostProcessor.processUserCreatesCommentForOrgPost(jsonBody);

    return await EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _processUserCommentsOrgComment(activity) {
    const jsonBody = await ActivityToNotificationRepository.findForUserCreatesCommentForOrgComment(activity.id);
    const recipientId = jsonBody.target_entity.comment.organization.user_id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }
    ApiPostProcessor.processUserCreatesCommentForOrgComment(jsonBody);

    return await EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  static async _userCreatesCommentForPost(activity) {
    switch(activity.activity_group_id) {
      case ActivityGroupDictionary.getGroupContentCreation():
        {
          const dbData = await ActivityToNotificationRepository.findForUserCreatesCommentForPost(activity.id);
          const recipientId = dbData.target_entity.post.User.id;
          ApiPostProcessor.processUserCreatesCommentForPost(dbData);
          await EntityNotificationRepository.createUserCreatesCommentForPost(activity, recipientId, dbData);
        }
        break;
      default:
        this._logNotProcessed(activity);
    }
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  static async _userCreatesCommentForComment(activity) {
    switch(activity.activity_group_id) {
      case ActivityGroupDictionary.getGroupContentCreation():
        {
          const dbData = await ActivityToNotificationRepository.findForUserCreatesCommentForComment(activity.id);
          ApiPostProcessor.processUserCreatesCommentForComment(dbData);

          const recipientId = dbData.target_entity.comment.User.id;

          await EntityNotificationRepository.createUserCreatesCommentForComment(activity, recipientId, dbData);
        }
        break;
      default:
        this._logNotProcessed(activity);
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
        this._logNotProcessed(activity);
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

  /**
   *
   * @param {Object} activity
   * @private
   */
  static _logNotProcessed(activity) {
    console.warn(`No rule to process notification for activity_type_id: ${activity.activity_type_id}. Entity ID is: ${activity.id}`);
  }

}

module.exports = EntityNotificationsCreator;