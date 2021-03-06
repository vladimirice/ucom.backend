import { EventsIdsDictionary } from 'ucom.libs.common';

const superagent = require('superagent');

const config    = require('config');

const websocketHost = config.servers.websocket;

const { ConsumerLogger } = require('../../../config/winston');

const entityNotificationRepository      = require('../../entities/repository').Notifications;
const activityToNotificationRepository  = require('../../users/repository').ActivityToNotification;
const usersActivityRepository           = require('../../users/repository').Activity;

const apiPostProcessor = require('../../common/service').PostProcessor;

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

    const activity = await usersActivityRepository.findOnlyItselfById(+message.id);
    if (!activity) {
      throw new Error(`There is no activity with the ID ${message.id}. Probably you sent it to rabbit before committing transaction`);
    }

    const executor = this.getExecutor(activity.event_id);

    if (!executor) {
      this.logNotProcessed(activity);
      // eslint-disable-next-line no-console
      console.log('Not required to process');

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
  private static async userMentionsYouInsidePost(activity) {
    const jsonBody = await activityToNotificationRepository.findUserMentionsYouInsidePost(activity.id);
    const recipientId = jsonBody.target_entity.User.id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }

    apiPostProcessor.processUserMentionsYouInsidePost(jsonBody);

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userMentionsYouInsideComment(activity) {
    const jsonBody = await activityToNotificationRepository.findUserMentionsYouInsideComment(activity.id);
    const recipientId = jsonBody.target_entity.User.id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }

    apiPostProcessor.processUserMentionsYouInsideComment(jsonBody);

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async processUserCommentsOrgPost(activity) {
    const jsonBody = await activityToNotificationRepository.findForUserCreatesCommentForOrgPost(activity.id);

    const recipientId = jsonBody.target_entity.post.organization.user_id;
    apiPostProcessor.processUserCreatesCommentForOrgPost(jsonBody);

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async processUserCommentsOrgComment(activity) {
    const jsonBody = await activityToNotificationRepository.findForUserCreatesCommentForOrgComment(activity.id);
    const recipientId = jsonBody.target_entity.comment.organization.user_id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }
    apiPostProcessor.processUserCreatesCommentForOrgComment(jsonBody);

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userCreatesDirectPostForOtherUser(activity) {
    const jsonBody = await activityToNotificationRepository.findUserCreatesDirectPostForOtherUser(activity.id);
    const recipientId = jsonBody.target_entity.User.id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }

    apiPostProcessor.processUserCreatesDirectPostForOtherUser(jsonBody);

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userCreatesDirectPostForOrg(activity) {
    const jsonBody = await activityToNotificationRepository.findUserCreatesDirectPostForOrg(activity.id);
    const recipientId = jsonBody.target_entity.organization.user_id;

    if (!recipientId) {
      throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
    }

    apiPostProcessor.processUserCreatesDirectPostForOrg(jsonBody);

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  private static async userCreatesCommentForPost(activity) {
    const jsonBody = await activityToNotificationRepository.findForUserCreatesCommentForPost(activity.id);
    const recipientId = jsonBody.target_entity.post.User.id;
    apiPostProcessor.processUserCreatesCommentForPost(jsonBody);

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  private static async userCreatesCommentForComment(activity) {
    const jsonBody = await activityToNotificationRepository.findForUserCreatesCommentForComment(activity.id);
    apiPostProcessor.processUserCreatesCommentForComment(jsonBody);

    const recipientId = jsonBody.target_entity.comment.User.id;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<Object>}
   * @private
   */
  private static async createOrgBoardInvitation(activity) {
    const jsonBody = await activityToNotificationRepository.findForOrgTeamInvitation(activity.id);

    apiPostProcessor.processOneOrgUsersTeamInvitation(jsonBody);

    const recipientId = activity.entity_id_to;

    return entityNotificationRepository.createNewNotification(
      activity.event_id,
      recipientId,
      activity.id,
      jsonBody,
    );
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userVotesPostOfOtherUser(activity) {
    const jsonData = await activityToNotificationRepository.findForUserVotesPostOfOtherUser(activity.id);
    apiPostProcessor.processUserVotesPostOfOtherUser(jsonData);

    const recipientId = jsonData.target_entity.post.user_id;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userVotesCommentOfOtherUser(activity) {
    const jsonData = await activityToNotificationRepository.findForUserVotesCommentOfOtherUser(activity.id);
    apiPostProcessor.processUserVotesCommentOfOtherUser(jsonData);

    const recipientId = jsonData.target_entity.comment.user_id;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userVotesCommentOfOrg(activity) {
    const jsonData = await activityToNotificationRepository.findForUserVotesCommentOfOrg(activity.id);
    apiPostProcessor.processUserVotesCommentOfOrg(jsonData);

    const recipientId = jsonData.target_entity.comment.user_id;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userRepostsOtherUserPost(activity) {
    const jsonData = await activityToNotificationRepository.findForUserRepostsOtherUserPost(activity.id);
    apiPostProcessor.processUserRepostsOtherUserPost(jsonData);

    const recipientId = jsonData.target_entity.post.user_id;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userRepostsOrgPost(activity) {
    const jsonData = await activityToNotificationRepository.findForUserRepostsOrgPost(activity.id);
    apiPostProcessor.processUserRepostsOrgPost(jsonData);

    const recipientId = jsonData.target_entity.post.user_id;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userVotesPostOfOrg(activity) {
    const jsonData = await activityToNotificationRepository.findForUserVotesPostOfOrg(activity.id);
    apiPostProcessor.processUserVotesPostOfOrg(jsonData);

    const recipientId = jsonData.target_entity.post.user_id;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userFollowsOtherUser(activity) {
    const jsonData = await activityToNotificationRepository.findForUserFollowsOtherUser(activity.id);
    apiPostProcessor.processOneUserFollowsOtherUserNotification(jsonData);

    const recipientId = activity.entity_id_to;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<data>}
   * @private
   */
  private static async userTrustsOtherUser(activity) {
    const jsonData = await activityToNotificationRepository.findForUserTrustsOtherUser(activity.id);
    apiPostProcessor.processOneUserTrustsOtherUserNotification(jsonData);

    const recipientId = activity.entity_id_to;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   * @private
   */
  private static async userFollowsOrg(activity) {
    const jsonBody = await activityToNotificationRepository.findForUserFollowsOrgNotification(activity.id);
    apiPostProcessor.processOneUserFollowsOrgNotification(jsonBody);
    const recipientId = jsonBody.target_entity.organization.user_id;

    return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
  }

  /**
   *
   * @param {number} eventId
   */
  private static getExecutor(eventId) {
    const eventExecutors = {
      // mention
      [EventsIdsDictionary.getUserHasMentionedYouInPost()]:         this.userMentionsYouInsidePost,
      [EventsIdsDictionary.getUserHasMentionedYouInComment()]:      this.userMentionsYouInsideComment,

      // Following
      [EventsIdsDictionary.getUserFollowsYou()]:                    this.userFollowsOtherUser,
      [EventsIdsDictionary.getUserFollowsOrg()]:                    this.userFollowsOrg,

      // Trust
      [EventsIdsDictionary.getUserTrustsYou()]:                    this.userTrustsOtherUser,

      // Commenting
      [EventsIdsDictionary.getUserCommentsOrgPost()]:               this.processUserCommentsOrgPost,
      [EventsIdsDictionary.getUserCommentsOrgComment()]:            this.processUserCommentsOrgComment,
      [EventsIdsDictionary.getUserCommentsPost()]:                  this.userCreatesCommentForPost,
      [EventsIdsDictionary.getUserCommentsComment()]:               this.userCreatesCommentForComment,

      // Posting
      [EventsIdsDictionary.userCreatesDirectPostForOtherUser()]:    this.userCreatesDirectPostForOtherUser,
      [EventsIdsDictionary.getUserCreatesDirectPostForOrg()]:       this.userCreatesDirectPostForOrg,

      // Invitations
      [EventsIdsDictionary.getOrgUsersTeamInvitation()]:            this.createOrgBoardInvitation,

      // Voting
      [EventsIdsDictionary.getUserUpvotesPostOfOtherUser()]:        this.userVotesPostOfOtherUser,
      [EventsIdsDictionary.getUserDownvotesPostOfOtherUser()]:      this.userVotesPostOfOtherUser,

      [EventsIdsDictionary.getUserUpvotesPostOfOrg()]:              this.userVotesPostOfOrg,
      [EventsIdsDictionary.getUserDownvotesPostOfOrg()]:            this.userVotesPostOfOrg,

      [EventsIdsDictionary.getUserUpvotesCommentOfOtherUser()]:     this.userVotesCommentOfOtherUser,
      [EventsIdsDictionary.getUserDownvotesCommentOfOtherUser()]:   this.userVotesCommentOfOtherUser,

      [EventsIdsDictionary.getUserUpvotesCommentOfOrg()]:           this.userVotesCommentOfOrg,
      [EventsIdsDictionary.getUserDownvotesCommentOfOrg()]:         this.userVotesCommentOfOrg,

      // Repost
      [EventsIdsDictionary.getUserRepostsOtherUserPost()]:          this.userRepostsOtherUserPost,
      [EventsIdsDictionary.getUserRepostsOrgPost()]:                this.userRepostsOrgPost,

    };

    return eventExecutors[eventId];
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<void>}
   */
  static async sendUnreadMessagesNotificationsViaSockets(userId) {
    const unreadMessagesCount = await entityNotificationRepository.countUnreadMessages(userId);
    const payload = {
      unread_messages_count: unreadMessagesCount,
    };

    await superagent
      .post(`${websocketHost}/emit_to_user`)
      .send({
        userId,
        payload,
      })
    ;
  }

  /**
   *
   * @param {Object} activity
   * @private
   */
  private static logNotProcessed(activity) {
    ConsumerLogger.warn(`No rule to process notification for activity_type_id: ${activity.activity_type_id}. Entity ID is: ${activity.id}`);
  }
}

export = EntityNotificationsCreator;
