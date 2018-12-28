const axios = require('axios');

const config    = require('config');
const websocketHost = config.servers.websocket;

const { ConsumerLogger } = require('../../../config/winston');

const EntityNotificationRepository      = require('../../entities/repository').Notifications;
const ActivityToNotificationRepository  = require('../../users/repository').ActivityToNotification;
const UsersActivityRepository           = require('../../users/repository').Activity;

const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');

const ApiPostProcessor = require('../../common/service').PostProcessor;
const EventIdDictionary = require('../../../lib/entities/dictionary').EventId;

class EntityNotificationsCreator {

  /**
   *
   * @param {Object} message
   * @return {Promise<void>}
   */
  static async processJob(message) {
    if (!message.id) {
      throw new Error(`Malformed message. ID is required. Message is: ${JSON.stringify(message)}`);
    }

    const activity = await UsersActivityRepository.findOnlyItselfById(+message.id);
    if (!activity) {
      throw new Error(`There is no activity with the ID ${message.id}. Probably you sent it to rabbit before committing transaction`);
    }

    const executor = this._getExecutor(activity.event_id);

    if (!executor) {
      this._logNotProcessed(activity);

      return;
    }

    const notification = await executor(activity);
    await this.sendUnreadMessagesNotificationsViaSockets(notification.recipient_entity_id);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userMentionsYouInsidePost(activity) {
    const jsonBody = await ActivityToNotificationRepository.findUserMentionsYouInsidePost(activity.id);
    const recipientId = jsonBody.target_entity.User.id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }

    ApiPostProcessor.processUserMentionsYouInsidePost(jsonBody);

    return await EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userMentionsYouInsideComment(activity) {
    const jsonBody = await ActivityToNotificationRepository.findUserMentionsYouInsideComment(activity.id);
    const recipientId = jsonBody.target_entity.User.id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }

    ApiPostProcessor.processUserMentionsYouInsideComment(jsonBody);

    return await EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _processUserCommentsOrgPost(activity) {
    const jsonBody = await ActivityToNotificationRepository.findForUserCreatesCommentForOrgPost(activity.id);

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
   * @return {Promise<data>}
   * @private
   */
  static async _userCreatesDirectPostForOtherUser(activity) {
    const jsonBody = await ActivityToNotificationRepository.findUserCreatesDirectPostForOtherUser(activity.id);
    const recipientId = jsonBody.target_entity.User.id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }

    ApiPostProcessor.processUserCreatesDirectPostForOtherUser(jsonBody);

    return await EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userCreatesDirectPostForOrg(activity) {
    const jsonBody = await ActivityToNotificationRepository.findUserCreatesDirectPostForOrg(activity.id);
    const recipientId = jsonBody.target_entity.organization.user_id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }

    ApiPostProcessor.processUserCreatesDirectPostForOrg(jsonBody);

    return await EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  static async _userCreatesCommentForPost(activity) {
    const jsonBody = await ActivityToNotificationRepository.findForUserCreatesCommentForPost(activity.id);
    const recipientId = jsonBody.target_entity.post.User.id;
    ApiPostProcessor.processUserCreatesCommentForPost(jsonBody);

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  static async _userCreatesCommentForComment(activity) {
    const jsonBody = await ActivityToNotificationRepository.findForUserCreatesCommentForComment(activity.id);
    ApiPostProcessor.processUserCreatesCommentForComment(jsonBody);

    const recipientId = jsonBody.target_entity.comment.User.id;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<Object>}
   * @private
   */
  static async _createOrgBoardInvitation(activity) {
    const jsonBody = await ActivityToNotificationRepository.findForOrgTeamInvitation(activity.id);

    ApiPostProcessor.processOneOrgUsersTeamInvitation(jsonBody);

    const recipientId = activity.entity_id_to;

    return EntityNotificationRepository.createNewNotification(
      activity.event_id,
      recipientId,
      activity.id,
      jsonBody
    );
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userVotesPostOfOtherUser(activity) {
    const jsonData = await ActivityToNotificationRepository.findForUserVotesPostOfOtherUser(activity.id);
    ApiPostProcessor.processUserVotesPostOfOtherUser(jsonData);

    const recipientId = jsonData.target_entity.post.user_id;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userVotesCommentOfOtherUser(activity) {
    const jsonData = await ActivityToNotificationRepository.findForUserVotesCommentOfOtherUser(activity.id);
    ApiPostProcessor.processUserVotesCommentOfOtherUser(jsonData);

    const recipientId = jsonData.target_entity.comment.user_id;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userVotesCommentOfOrg(activity) {
    const jsonData = await ActivityToNotificationRepository.findForUserVotesCommentOfOrg(activity.id);
    ApiPostProcessor.processUserVotesCommentOfOrg(jsonData);

    const recipientId = jsonData.target_entity.comment.user_id;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userRepostsOtherUserPost(activity) {
    const jsonData = await ActivityToNotificationRepository.findForUserRepostsOtherUserPost(activity.id);
    ApiPostProcessor.processUserRepostsOtherUserPost(jsonData);

    const recipientId = jsonData.target_entity.post.user_id;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userRepostsOrgPost(activity) {
    const jsonData = await ActivityToNotificationRepository.findForUserRepostsOrgPost(activity.id);
    ApiPostProcessor.processUserRepostsOrgPost(jsonData);

    const recipientId = jsonData.target_entity.post.user_id;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userVotesPostOfOrg(activity) {
    const jsonData = await ActivityToNotificationRepository.findForUserVotesPostOfOrg(activity.id);
    ApiPostProcessor.processUserVotesPostOfOrg(jsonData);

    const recipientId = jsonData.target_entity.post.user_id;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  static async _userFollowsOtherUser(activity) {
    const jsonData = await ActivityToNotificationRepository.findForUserFollowsOtherUser(activity.id);
    ApiPostProcessor.processOneUserFollowsOtherUserNotification(jsonData);

    const recipientId = activity.entity_id_to;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  static async _userFollowsOrg(activity) {
    const jsonBody = await ActivityToNotificationRepository.findForUserFollowsOrgNotification(activity.id);
    ApiPostProcessor.processOneUserFollowsOrgNotification(jsonBody);
    const recipientId = jsonBody.target_entity.organization.user_id;

    return EntityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  static async _createUserFollows(activity) {
    switch (activity.activity_group_id) {
      case ActivityGroupDictionary.getGroupContentInteraction():
      {

      }
        break;
      default:
        this._logNotProcessed(activity);
    }
  }

  /**
   *
   * @param {number} eventId
   */
  static _getExecutor(eventId) {
    const eventExecutors = {
      // mention
      [EventIdDictionary.getUserHasMentionedYouInPost()]:         this._userMentionsYouInsidePost,
      [EventIdDictionary.getUserHasMentionedYouInComment()]:      this._userMentionsYouInsideComment,

      // Following
      [EventIdDictionary.getUserFollowsYou()]:                    this._userFollowsOtherUser,
      [EventIdDictionary.getUserFollowsOrg()]:                    this._userFollowsOrg,

      // Commenting
      [EventIdDictionary.getUserCommentsOrgPost()]:               this._processUserCommentsOrgPost,
      [EventIdDictionary.getUserCommentsOrgComment()]:            this._processUserCommentsOrgComment,
      [EventIdDictionary.getUserCommentsPost()]:                  this._userCreatesCommentForPost,
      [EventIdDictionary.getUserCommentsComment()]:               this._userCreatesCommentForComment,

      // Posting
      [EventIdDictionary.getUserCreatesDirectPostForOtherUser()]: this._userCreatesDirectPostForOtherUser,
      [EventIdDictionary.getUserCreatesDirectPostForOrg()]:       this._userCreatesDirectPostForOrg,

      // Invitations
      [EventIdDictionary.getOrgUsersTeamInvitation()]:            this._createOrgBoardInvitation,

      // Voting
      [EventIdDictionary.getUserUpvotesPostOfOtherUser()]:        this._userVotesPostOfOtherUser,
      [EventIdDictionary.getUserDownvotesPostOfOtherUser()]:      this._userVotesPostOfOtherUser,

      [EventIdDictionary.getUserUpvotesPostOfOrg()]:              this._userVotesPostOfOrg,
      [EventIdDictionary.getUserDownvotesPostOfOrg()]:            this._userVotesPostOfOrg,

      [EventIdDictionary.getUserUpvotesCommentOfOtherUser()]:     this._userVotesCommentOfOtherUser,
      [EventIdDictionary.getUserDownvotesCommentOfOtherUser()]:   this._userVotesCommentOfOtherUser,

      [EventIdDictionary.getUserUpvotesCommentOfOrg()]:           this._userVotesCommentOfOrg,
      [EventIdDictionary.getUserDownvotesCommentOfOrg()]:         this._userVotesCommentOfOrg,


      // Repost
      [EventIdDictionary.getUserRepostsOtherUserPost()]:          this._userRepostsOtherUserPost,
      [EventIdDictionary.getUserRepostsOrgPost()]:                this._userRepostsOrgPost,

    };

    return eventExecutors[eventId];
  }


  /**
   *
   * @param {number} userId
   * @return {Promise<void>}
   */
  static async sendUnreadMessagesNotificationsViaSockets(userId) {
    const unread_messages_count = await EntityNotificationRepository.countUnreadMessages(userId);
    const payload = {
      unread_messages_count
    };

    // noinspection JSUnresolvedFunction
    await axios.post(`${websocketHost}/emit_to_user`, {
      userId,
      payload
    });
  }

  /**
   *
   * @param {Object} activity
   * @private
   */
  static _logNotProcessed(activity) {
    ConsumerLogger.warn(`No rule to process notification for activity_type_id: ${activity.activity_type_id}. Entity ID is: ${activity.id}`);
  }
}

module.exports = EntityNotificationsCreator;