"use strict";
/* tslint:disable:max-line-length */
const axios = require('axios');
const config = require('config');
const websocketHost = config.servers.websocket;
const { ConsumerLogger } = require('../../../config/winston');
const entityNotificationRepository = require('../../entities/repository').Notifications;
const activityToNotificationRepository = require('../../users/repository').ActivityToNotification;
const usersActivityRepository = require('../../users/repository').Activity;
const apiPostProcessor = require('../../common/service').PostProcessor;
const eventIdDictionary = require('../../../lib/entities/dictionary').EventId;
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
    static async userMentionsYouInsidePost(activity) {
        const jsonBody = await activityToNotificationRepository.findUserMentionsYouInsidePost(activity.id);
        const recipientId = jsonBody.target_entity.User.id;
        if (!recipientId) {
            throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
        }
        apiPostProcessor.processUserMentionsYouInsidePost(jsonBody);
        return await entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<data>}
     * @private
     */
    static async userMentionsYouInsideComment(activity) {
        const jsonBody = await activityToNotificationRepository.findUserMentionsYouInsideComment(activity.id);
        const recipientId = jsonBody.target_entity.User.id;
        if (!recipientId) {
            throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
        }
        apiPostProcessor.processUserMentionsYouInsideComment(jsonBody);
        return await entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<data>}
     * @private
     */
    static async processUserCommentsOrgPost(activity) {
        const jsonBody = await activityToNotificationRepository.findForUserCreatesCommentForOrgPost(activity.id);
        const recipientId = jsonBody.target_entity.post.organization.user_id;
        apiPostProcessor.processUserCreatesCommentForOrgPost(jsonBody);
        return await entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<data>}
     * @private
     */
    static async processUserCommentsOrgComment(activity) {
        const jsonBody = await activityToNotificationRepository.findForUserCreatesCommentForOrgComment(activity.id);
        const recipientId = jsonBody.target_entity.comment.organization.user_id;
        if (!recipientId) {
            throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
        }
        apiPostProcessor.processUserCreatesCommentForOrgComment(jsonBody);
        return await entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<data>}
     * @private
     */
    static async userCreatesDirectPostForOtherUser(activity) {
        const jsonBody = await activityToNotificationRepository.findUserCreatesDirectPostForOtherUser(activity.id);
        const recipientId = jsonBody.target_entity.User.id;
        if (!recipientId) {
            throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
        }
        apiPostProcessor.processUserCreatesDirectPostForOtherUser(jsonBody);
        return await entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<data>}
     * @private
     */
    static async userCreatesDirectPostForOrg(activity) {
        const jsonBody = await activityToNotificationRepository.findUserCreatesDirectPostForOrg(activity.id);
        const recipientId = jsonBody.target_entity.organization.user_id;
        if (!recipientId) {
            throw new Error(`There is no recipient ID - data is corrupted: ${JSON.stringify(jsonBody, null, 2)}`);
        }
        apiPostProcessor.processUserCreatesDirectPostForOrg(jsonBody);
        return await entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<void>}
     * @private
     */
    static async userCreatesCommentForPost(activity) {
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
    static async userCreatesCommentForComment(activity) {
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
    static async createOrgBoardInvitation(activity) {
        const jsonBody = await activityToNotificationRepository.findForOrgTeamInvitation(activity.id);
        apiPostProcessor.processOneOrgUsersTeamInvitation(jsonBody);
        const recipientId = activity.entity_id_to;
        return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<data>}
     * @private
     */
    static async userVotesPostOfOtherUser(activity) {
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
    static async userVotesCommentOfOtherUser(activity) {
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
    static async userVotesCommentOfOrg(activity) {
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
    static async userRepostsOtherUserPost(activity) {
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
    static async userRepostsOrgPost(activity) {
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
    static async userVotesPostOfOrg(activity) {
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
    static async userFollowsOtherUser(activity) {
        const jsonData = await activityToNotificationRepository.findForUserFollowsOtherUser(activity.id);
        apiPostProcessor.processOneUserFollowsOtherUserNotification(jsonData);
        const recipientId = activity.entity_id_to;
        return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonData);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<void>}
     * @private
     */
    static async userFollowsOrg(activity) {
        const jsonBody = await activityToNotificationRepository.findForUserFollowsOrgNotification(activity.id);
        apiPostProcessor.processOneUserFollowsOrgNotification(jsonBody);
        const recipientId = jsonBody.target_entity.organization.user_id;
        return entityNotificationRepository.createNewNotification(activity.event_id, recipientId, activity.id, jsonBody);
    }
    /**
     *
     * @param {number} eventId
     */
    static getExecutor(eventId) {
        const eventExecutors = {
            // mention
            [eventIdDictionary.getUserHasMentionedYouInPost()]: this.userMentionsYouInsidePost,
            [eventIdDictionary.getUserHasMentionedYouInComment()]: this.userMentionsYouInsideComment,
            // Following
            [eventIdDictionary.getUserFollowsYou()]: this.userFollowsOtherUser,
            [eventIdDictionary.getUserFollowsOrg()]: this.userFollowsOrg,
            // Commenting
            [eventIdDictionary.getUserCommentsOrgPost()]: this.processUserCommentsOrgPost,
            [eventIdDictionary.getUserCommentsOrgComment()]: this.processUserCommentsOrgComment,
            [eventIdDictionary.getUserCommentsPost()]: this.userCreatesCommentForPost,
            [eventIdDictionary.getUserCommentsComment()]: this.userCreatesCommentForComment,
            // Posting
            [eventIdDictionary.getUserCreatesDirectPostForOtherUser()]: this.userCreatesDirectPostForOtherUser,
            [eventIdDictionary.getUserCreatesDirectPostForOrg()]: this.userCreatesDirectPostForOrg,
            // Invitations
            [eventIdDictionary.getOrgUsersTeamInvitation()]: this.createOrgBoardInvitation,
            // Voting
            [eventIdDictionary.getUserUpvotesPostOfOtherUser()]: this.userVotesPostOfOtherUser,
            [eventIdDictionary.getUserDownvotesPostOfOtherUser()]: this.userVotesPostOfOtherUser,
            [eventIdDictionary.getUserUpvotesPostOfOrg()]: this.userVotesPostOfOrg,
            [eventIdDictionary.getUserDownvotesPostOfOrg()]: this.userVotesPostOfOrg,
            [eventIdDictionary.getUserUpvotesCommentOfOtherUser()]: this.userVotesCommentOfOtherUser,
            [eventIdDictionary.getUserDownvotesCommentOfOtherUser()]: this.userVotesCommentOfOtherUser,
            [eventIdDictionary.getUserUpvotesCommentOfOrg()]: this.userVotesCommentOfOrg,
            [eventIdDictionary.getUserDownvotesCommentOfOrg()]: this.userVotesCommentOfOrg,
            // Repost
            [eventIdDictionary.getUserRepostsOtherUserPost()]: this.userRepostsOtherUserPost,
            [eventIdDictionary.getUserRepostsOrgPost()]: this.userRepostsOrgPost,
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
        // noinspection JSUnresolvedFunction
        await axios.post(`${websocketHost}/emit_to_user`, {
            userId,
            payload,
        });
    }
    /**
     *
     * @param {Object} activity
     * @private
     */
    static logNotProcessed(activity) {
        ConsumerLogger.warn(`No rule to process notification for activity_type_id: ${activity.activity_type_id}. Entity ID is: ${activity.id}`);
    }
}
module.exports = EntityNotificationsCreator;
