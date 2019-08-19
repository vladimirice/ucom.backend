"use strict";
const errors_1 = require("../api/errors");
const knex = require("../../config/knex");
const UsersActivityRepository = require("./repository/users-activity-repository");
const NotificationsEventIdDictionary = require("../entities/dictionary/notifications-event-id-dictionary");
const UsersActivityFollowRepository = require("./repository/users-activity/users-activity-follow-repository");
const ActivityGroupDictionary = require("../activity/activity-group-dictionary");
const UsersModelProvider = require("./users-model-provider");
const UserActivitySerializer = require("./job/user-activity-serializer");
const ActivityProducer = require("../jobs/activity-producer");
const PostsModelProvider = require("../posts/service/posts-model-provider");
const CommentsModelProvider = require("../comments/service/comments-model-provider");
const EosTransactionService = require("../eos/eos-transaction-service");
const OrganizationsModelProvider = require("../organizations/service/organizations-model-provider");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const status = require('statuses');
const _ = require('lodash');
// tslint:disable-next-line:max-line-length
const { TransactionFactory, ContentTypeDictionary, InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const usersRepository = require('../users/users-repository');
const { BadRequestError } = require('../api/errors');
const usersActivityRepository = require('../users/repository').Activity;
const activityGroupDictionary = require('../activity/activity-group-dictionary');
const userActivitySerializer = require('./job/user-activity-serializer');
const activityProducer = require('../jobs/activity-producer');
const commentsModelProvider = require('../comments/service').ModelProvider;
const postsModelProvider = require('../posts/service').ModelProvider;
const usersModelProvider = require('../users/service').ModelProvider;
const orgModelProvider = require('../organizations/service').ModelProvider;
const blockchainModelProvider = require('../eos/service/blockchain-model-provider');
const eventIdDictionary = require('../entities/dictionary').EventId;
const ACTIVITY_TYPE__UPVOTE_NODE = 20;
const ACTIVITY_TYPE__CANCEL_NODE_UPVOTING_NODE = 30;
class UserActivityService {
    static async processUserVotesChangingForBlockProducers(userId, blockchainNodeIds, transaction, eventId) {
        const data = [];
        for (const element of blockchainNodeIds) {
            data.push({
                activity_type_id: ACTIVITY_TYPE__UPVOTE_NODE,
                activity_group_id: activityGroupDictionary.getUserInteractsWithBlockchainNode(),
                user_id_from: userId,
                entity_id_to: element,
                entity_name: blockchainModelProvider.getEntityName(),
                event_id: eventId,
                // Not required fields
                signed_transaction: '',
                blockchain_response: '',
                blockchain_status: 0,
                entity_id_on: null,
                entity_name_on: null,
            });
        }
        return usersActivityRepository.bulkCreateNewActivity(data, transaction);
    }
    static async processUserCancelVotesForBlockProducers(userId, blockchainNodeIds, transaction, eventId) {
        const data = [];
        for (const element of blockchainNodeIds) {
            data.push({
                activity_type_id: ACTIVITY_TYPE__CANCEL_NODE_UPVOTING_NODE,
                activity_group_id: activityGroupDictionary.getUserInteractsWithBlockchainNode(),
                user_id_from: userId,
                entity_id_to: element,
                entity_name: blockchainModelProvider.getEntityName(),
                event_id: eventId,
                // Not required fields
                signed_transaction: '',
                blockchain_response: '',
                blockchain_status: 0,
                entity_id_on: null,
                entity_name_on: null,
            });
        }
        return usersActivityRepository.bulkCreateNewActivity(data, transaction);
    }
    static async processNewOrganization(signedTransaction, currentUserId, newOrganizationId, transaction) {
        const data = {
            activity_type_id: ContentTypeDictionary.getTypeOrganization(),
            activity_group_id: ActivityGroupDictionary.getGroupContentCreation(),
            user_id_from: currentUserId,
            entity_id_to: newOrganizationId,
            entity_name: OrganizationsModelProvider.getEntityName(),
            signed_transaction: signedTransaction,
            event_id: EventsIds.userCreatesOrganization(),
        };
        return UsersActivityRepository.createNewActivity(data, transaction);
    }
    static async processOrganizationUpdating(signedTransaction, currentUserId, newOrganizationId, transaction) {
        const data = {
            activity_type_id: ContentTypeDictionary.getTypeOrganization(),
            activity_group_id: ActivityGroupDictionary.getGroupContentUpdating(),
            user_id_from: currentUserId,
            entity_id_to: newOrganizationId,
            entity_name: OrganizationsModelProvider.getEntityName(),
            signed_transaction: signedTransaction,
            event_id: EventsIds.userUpdatesOrganization(),
        };
        return UsersActivityRepository.createNewActivity(data, transaction);
    }
    /**
     *
     * @param {number} currentUserId
     * @param {number} targetUserId
     * @param {number} newOrganizationId
     * @param {Object} transaction
     * @return {Promise<Object>}
     */
    static async processUsersBoardInvitation(currentUserId, targetUserId, newOrganizationId, transaction) {
        const data = {
            activity_type_id: InteractionTypeDictionary.getOrgTeamInvitation(),
            activity_group_id: activityGroupDictionary.getGroupUsersTeamInvitation(),
            user_id_from: currentUserId,
            entity_id_to: targetUserId,
            entity_name: usersModelProvider.getEntityName(),
            entity_id_on: newOrganizationId,
            entity_name_on: orgModelProvider.getEntityName(),
            signed_transaction: '',
            event_id: eventIdDictionary.getOrgUsersTeamInvitation(),
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    static async createForUserVotesPost(activityTypeId, signedTransaction, currentUserId, postIdTo, eventId, transaction) {
        const data = {
            activity_type_id: activityTypeId,
            activity_group_id: ActivityGroupDictionary.getGroupContentInteraction(),
            user_id_from: currentUserId,
            entity_id_to: postIdTo,
            entity_name: PostsModelProvider.getEntityName(),
            signed_transaction: signedTransaction,
            event_id: eventId,
        };
        return UsersActivityRepository.createNewKnexActivity(data, transaction);
    }
    static async createForUserCreatesProfile(signedTransaction, currentUserId, transaction = null) {
        const data = {
            user_id_from: currentUserId,
            entity_id_to: currentUserId,
            signed_transaction: signedTransaction,
            activity_type_id: ActivityGroupDictionary.getUserProfile(),
            activity_group_id: ActivityGroupDictionary.getUserProfile(),
            entity_name: UsersModelProvider.getEntityName(),
            event_id: EventsIds.userCreatesProfile(),
        };
        return usersActivityRepository.createNewKnexActivity(data, transaction);
    }
    static async createForUserUpdatesProfile(signedTransaction, currentUserId, transaction = null) {
        const data = {
            user_id_from: currentUserId,
            entity_id_to: currentUserId,
            signed_transaction: signedTransaction,
            activity_type_id: ActivityGroupDictionary.getUserProfile(),
            activity_group_id: ActivityGroupDictionary.getUserProfile(),
            entity_name: UsersModelProvider.getEntityName(),
            event_id: EventsIds.userUpdatesProfile(),
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    static async createForUserUpdatesProfileViaKnex(signedTransaction, currentUserId, transaction = null) {
        const data = {
            user_id_from: currentUserId,
            entity_id_to: currentUserId,
            signed_transaction: signedTransaction,
            activity_type_id: ActivityGroupDictionary.getUserProfile(),
            activity_group_id: ActivityGroupDictionary.getUserProfile(),
            entity_name: UsersModelProvider.getEntityName(),
            event_id: EventsIds.userUpdatesProfile(),
        };
        return usersActivityRepository.createNewKnexActivity(data, transaction);
    }
    static async createForUserVotesComment(interactionType, signedTransaction, currentUserId, commentId, eventId, transaction) {
        const data = {
            activity_type_id: interactionType,
            activity_group_id: activityGroupDictionary.getGroupContentInteraction(),
            user_id_from: currentUserId,
            entity_id_to: commentId,
            entity_name: CommentsModelProvider.getEntityName(),
            signed_transaction: signedTransaction,
            event_id: eventId,
        };
        return usersActivityRepository.createNewKnexActivity(data, transaction);
    }
    static async processOrganizationCreatesPost(newPost, eventId, signedTransaction, currentUserId, transaction = null) {
        const activityGroupId = activityGroupDictionary.getGroupContentCreationByOrganization();
        const entityName = postsModelProvider.getEntityName();
        const data = {
            activity_type_id: newPost.post_type_id,
            activity_group_id: activityGroupId,
            user_id_from: currentUserId,
            entity_id_to: newPost.id,
            entity_name: entityName,
            signed_transaction: signedTransaction,
            event_id: eventId,
            entity_id_on: newPost.entity_id_for,
            entity_name_on: newPost.entity_name_for,
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    static async processPostIsUpdated(updatedPost, currentUserId, eventId, transaction, signedTransaction = '') {
        const activityGroupId = ActivityGroupDictionary.getGroupContentUpdating();
        const entityName = postsModelProvider.getEntityName();
        const data = {
            activity_type_id: updatedPost.post_type_id,
            activity_group_id: activityGroupId,
            user_id_from: currentUserId,
            entity_id_to: updatedPost.id,
            entity_name: entityName,
            event_id: eventId,
            signed_transaction: signedTransaction,
            entity_id_on: updatedPost.entity_id_for,
            entity_name_on: updatedPost.entity_name_for,
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    /**
     *
     * @param {Object} newPost
     * @param {string} signedTransaction
     * @param {number} currentUserId
     * @param {number} eventId
     * @param {Object|null} transaction
     * @return {Promise<void|Object|*>}
     */
    static async processOrganizationCreatesRepost(newPost, eventId, signedTransaction, currentUserId, transaction = null) {
        const activityGroupId = activityGroupDictionary.getGroupContentCreationByOrganization();
        const entityName = postsModelProvider.getEntityName();
        const entityNameOn = postsModelProvider.getEntityName();
        const data = {
            activity_type_id: newPost.post_type_id,
            activity_group_id: activityGroupId,
            user_id_from: currentUserId,
            entity_id_to: newPost.id,
            entity_name: entityName,
            signed_transaction: signedTransaction,
            event_id: eventId,
            entity_id_on: newPost.parent_id,
            entity_name_on: entityNameOn,
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    static async processUserHimselfCreatesPost(newPost, eventId, signedTransaction, currentUserId, transaction = null) {
        const activityGroupId = activityGroupDictionary.getGroupContentCreation();
        const entityName = postsModelProvider.getEntityName();
        const data = {
            activity_type_id: newPost.post_type_id,
            activity_group_id: activityGroupId,
            user_id_from: currentUserId,
            entity_id_to: newPost.id,
            entity_name: entityName,
            signed_transaction: signedTransaction,
            event_id: eventId,
            entity_id_on: newPost.entity_id_for,
            entity_name_on: newPost.entity_name_for,
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    /**
     *
     * @param {number} postIdWhereMentioned
     * @param {number} userIdWhoMention
     * @param {number} mentionedUserId
     * @param {Object|null} transaction
     * @return {Promise<void|Object|*>}
     */
    static async processUserMentionOtherUserInPost(postIdWhereMentioned, userIdWhoMention, mentionedUserId, transaction = null) {
        const activityGroupId = activityGroupDictionary.getGroupTagEvent();
        const postEntityName = postsModelProvider.getEntityName();
        const userEntityName = usersModelProvider.getEntityName();
        const eventId = eventIdDictionary.getUserHasMentionedYouInPost();
        const data = {
            activity_type_id: activityGroupId,
            activity_group_id: activityGroupId,
            user_id_from: userIdWhoMention,
            entity_id_to: mentionedUserId,
            entity_name: userEntityName,
            signed_transaction: '',
            event_id: eventId,
            entity_id_on: postIdWhereMentioned,
            entity_name_on: postEntityName,
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    /**
     *
     * @param {number} postIdWhereMentioned
     * @param {number} userIdWhoMention
     * @param {number} mentionedUserId
     * @param {Object|null} transaction
     * @return {Promise<void|Object|*>}
     */
    static async processUserMentionOtherUserInComment(postIdWhereMentioned, userIdWhoMention, mentionedUserId, transaction = null) {
        const activityGroupId = activityGroupDictionary.getGroupTagEvent();
        const entityNameOn = commentsModelProvider.getEntityName();
        const userEntityName = usersModelProvider.getEntityName();
        const eventId = eventIdDictionary.getUserHasMentionedYouInComment();
        const data = {
            activity_type_id: activityGroupId,
            activity_group_id: activityGroupId,
            user_id_from: userIdWhoMention,
            entity_id_to: mentionedUserId,
            entity_name: userEntityName,
            signed_transaction: '',
            event_id: eventId,
            entity_id_on: postIdWhereMentioned,
            entity_name_on: entityNameOn,
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    /**
     *
     * @param {Object} newPost
     * @param {string} signedTransaction
     * @param {number} currentUserId
     * @param {number} eventId
     * @param {Object|null} transaction
     * @return {Promise<void|Object|*>}
     */
    static async processUserHimselfCreatesRepost(newPost, eventId, signedTransaction, currentUserId, transaction = null) {
        const activityGroupId = activityGroupDictionary.getGroupContentCreation();
        const entityName = postsModelProvider.getEntityName();
        const entityNameOn = postsModelProvider.getEntityName();
        const data = {
            activity_type_id: newPost.post_type_id,
            activity_group_id: activityGroupId,
            user_id_from: currentUserId,
            entity_id_to: newPost.id,
            entity_name: entityName,
            signed_transaction: signedTransaction,
            event_id: eventId,
            entity_id_on: newPost.parent_id,
            entity_name_on: entityNameOn,
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    /**
     *
     * @param {number} currentUserId
     * @param {number} newCommentId
     * @param {string} signedTransaction
     * @param {boolean} isOrganization
     * @param {number} commentableId
     * @param {string} commentableName
     * @param {number} eventId
     * @param {Object} transaction
     * @return {Promise<Object>}
     */
    static async processCommentCreation(currentUserId, newCommentId, signedTransaction, isOrganization, commentableId, commentableName, eventId, transaction) {
        const activityTypeId = ContentTypeDictionary.getTypeComment();
        const commentsEntityName = commentsModelProvider.getEntityName();
        let activityGroupId;
        if (isOrganization) {
            activityGroupId = ActivityGroupDictionary.getGroupContentCreationByOrganization();
        }
        else {
            activityGroupId = ActivityGroupDictionary.getGroupContentCreation();
        }
        const data = {
            activity_type_id: activityTypeId,
            activity_group_id: activityGroupId,
            user_id_from: currentUserId,
            entity_id_to: newCommentId,
            entity_name: commentsEntityName,
            signed_transaction: signedTransaction,
            entity_id_on: commentableId,
            entity_name_on: commentableName,
            event_id: eventId,
        };
        return usersActivityRepository.createNewActivity(data, transaction);
    }
    /**
     * @param {number | null} userId
     * @returns {Promise<Object>}
     */
    static async getUserFollowActivityData(userId = null) {
        if (userId === null) {
            return {
                IFollow: [],
                myFollowers: [],
            };
        }
        const data = await usersActivityRepository.findOneUserFollowActivityData(userId);
        // tslint:disable-next-line:variable-name
        const IFollow = [];
        const myFollowers = [];
        data.forEach((activity) => {
            activity.entity_id_to = +activity.entity_id_to;
            if (InteractionTypeDictionary.isFollowActivity(activity)) {
                if (activity.user_id_from === userId) {
                    IFollow.push(activity.entity_id_to);
                }
                else if (activity.entity_id_to === userId) {
                    myFollowers.push(activity.user_id_from);
                }
            }
        });
        return {
            IFollow,
            myFollowers,
        };
    }
    static async userFollowsAnotherUser(userFrom, userIdTo, body) {
        const activityTypeId = InteractionTypeDictionary.getFollowId();
        await this.userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body);
    }
    static async userUnfollowsUser(userFrom, userIdTo, body) {
        const activityTypeId = InteractionTypeDictionary.getUnfollowId();
        await this.userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body);
    }
    /**
     *
     * @param {Object} userFrom
     * @param {string} newOrganizationBlockchainId
     * @return {Promise<Object>}
     */
    static async createAndSignOrganizationCreationTransaction(userFrom, newOrganizationBlockchainId) {
        // noinspection JSUnresolvedFunction
        return TransactionFactory.createSignedUserCreatesOrganization(userFrom.account_name, userFrom.private_key, newOrganizationBlockchainId);
    }
    static async userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body) {
        await this.checkPreconditions(userFrom, userIdTo, activityTypeId);
        const userToAccountName = await usersRepository.findAccountNameById(userIdTo);
        let signedTransaction;
        if (body && !_.isEmpty(body) && body.signed_transaction) {
            signedTransaction = body.signed_transaction;
        }
        else {
            signedTransaction = await this.getSignedFollowTransaction(userFrom, userToAccountName, activityTypeId);
        }
        const activity = await this.processUserFollowsOrUnfollowsUser(activityTypeId, signedTransaction, userFrom.id, userIdTo);
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(signedTransaction);
        await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
    }
    static async getSignedFollowTransaction(userFrom, userToAccountName, activityTypeId) {
        // eslint-disable-next-line no-underscore-dangle
        return TransactionFactory._getSignedUserToUser(userFrom.account_name, userFrom.private_key, userToAccountName, activityTypeId);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<void>}
     */
    static async sendPayloadToRabbit(activity) {
        const jsonPayload = userActivitySerializer.getActivityDataToCreateJob(activity.id);
        await activityProducer.publishWithUserActivity(jsonPayload);
    }
    static async sendPayloadToRabbitWithEosVersion(activity, signedTransaction) {
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(signedTransaction);
        this.sendPayloadToRabbitWithOptions(activity, options);
    }
    static async sendPayloadToRabbitEosV2(activity) {
        const jsonPayload = userActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);
        await activityProducer.publishWithUserActivity(jsonPayload);
    }
    static async sendContentCreationPayloadToRabbit(activity) {
        const jsonPayload = userActivitySerializer.getActivityDataToCreateJob(activity.id);
        await activityProducer.publishWithContentCreation(jsonPayload);
    }
    static async sendContentCreationPayloadToRabbitWithEosVersion(activity, signedTransactions) {
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(signedTransactions);
        this.sendContentCreationPayloadToRabbitWithOptions(activity, options);
    }
    static async sendPayloadToRabbitWithOptions(activity, options) {
        const jsonPayload = UserActivitySerializer.createJobWithOptions(activity.id, options);
        await ActivityProducer.publishWithUserActivity(jsonPayload);
    }
    static async sendContentUpdatingPayloadToRabbit(activity, options) {
        const jsonPayload = UserActivitySerializer.createJobWithOptions(activity.id, options);
        await activityProducer.publishWithContentUpdating(jsonPayload);
    }
    static async sendContentUpdatingPayloadToRabbitEosV2(activity) {
        const jsonPayload = userActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);
        await activityProducer.publishWithContentUpdating(jsonPayload);
    }
    /**
     *
     * @param {Object} userFrom
     * @param {number} userIdTo
     * @param {number} activityTypeId
     * @returns {Promise<void>}
     * @private
     */
    static async checkPreconditions(userFrom, userIdTo, activityTypeId) {
        if (userFrom.id === userIdTo) {
            throw new BadRequestError({
                general: 'It is not possible to follow yourself',
            }, status('400'));
        }
        const currentFollowActivity = await usersActivityRepository.getLastFollowOrUnfollowActivityForUser(userFrom.id, userIdTo);
        const currentFollowStatus = currentFollowActivity ? currentFollowActivity.activity_type_id : null;
        if (currentFollowStatus && currentFollowActivity.activity_type_id === activityTypeId) {
            throw new BadRequestError({
                general: 'It is not possible to follow/unfollow twice',
            }, status('400'));
        }
        if (!InteractionTypeDictionary.isOppositeActivityRequired(activityTypeId)) {
            return;
        }
        if (!currentFollowStatus || currentFollowStatus !== InteractionTypeDictionary.getOppositeFollowActivityTypeId(activityTypeId)) {
            throw new BadRequestError({
                general: 'It is not possible to unfollow before follow',
            }, status('400'));
        }
    }
    static async processUserFollowsOrUnfollowsUser(activityTypeId, signedTransaction, currentUserId, userIdTo) {
        const activityGroupId = ActivityGroupDictionary.getGroupUserUserInteraction();
        const entityName = UsersModelProvider.getEntityName();
        const eventId = activityTypeId === InteractionTypeDictionary.getFollowId() ?
            NotificationsEventIdDictionary.getUserFollowsYou() : NotificationsEventIdDictionary.getUserUnfollowsYou();
        return knex.transaction(async (trx) => {
            await this.createFollowIndex(eventId, currentUserId, userIdTo, trx);
            const data = {
                activity_type_id: activityTypeId,
                activity_group_id: activityGroupId,
                user_id_from: currentUserId,
                entity_id_to: userIdTo,
                entity_name: entityName,
                signed_transaction: signedTransaction,
                event_id: eventId,
            };
            return UsersActivityRepository.createNewKnexActivity(data, trx);
        });
    }
    static async createFollowIndex(eventId, userIdFrom, userIdTo, trx) {
        if (NotificationsEventIdDictionary.doesUserFollowOtherUser(eventId)) {
            await UsersActivityFollowRepository.insertOneFollowsOtherUser(userIdFrom, userIdTo, trx);
            return;
        }
        if (NotificationsEventIdDictionary.doesUserUnfollowOtherUser(eventId)) {
            const deleteRes = await UsersActivityFollowRepository.deleteOneFollowsOtherUser(userIdFrom, userIdTo, trx);
            if (deleteRes === null) {
                throw new errors_1.AppError(`No record to delete. It is possible that it is a concurrency issue. User ID from: ${userIdFrom}, user ID to ${userIdTo}`);
            }
            return;
        }
        throw new errors_1.AppError(`Unsupported eventId: ${eventId}`);
    }
    static async sendContentCreationPayloadToRabbitWithOptions(activity, options) {
        const jsonPayload = UserActivitySerializer.createJobWithOptions(activity.id, options);
        await activityProducer.publishWithContentCreation(jsonPayload);
    }
}
module.exports = UserActivityService;
