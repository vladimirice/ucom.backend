"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const errors_1 = require("../api/errors");
const knex = require("../../config/knex");
const UsersActivityRepository = require("./repository/users-activity-repository");
const UsersActivityFollowRepository = require("./repository/users-activity/users-activity-follow-repository");
const ActivityGroupDictionary = require("../activity/activity-group-dictionary");
const UsersModelProvider = require("./users-model-provider");
const UserActivitySerializer = require("./job/user-activity-serializer");
const ActivityProducer = require("../jobs/activity-producer");
const PostsModelProvider = require("../posts/service/posts-model-provider");
const CommentsModelProvider = require("../comments/service/comments-model-provider");
const EosTransactionService = require("../eos/eos-transaction-service");
const OrganizationsModelProvider = require("../organizations/service/organizations-model-provider");
const BlockchainModelProvider = require("../eos/service/blockchain-model-provider");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const status = require('statuses');
const ACTIVITY_TYPE__UPVOTE_NODE = 20;
const ACTIVITY_TYPE__CANCEL_NODE_UPVOTING_NODE = 30;
class UserActivityService {
    static async processUserVotesChangingForBlockProducers(userId, blockchainNodeIds, transaction, eventId) {
        const data = [];
        for (const element of blockchainNodeIds) {
            data.push({
                activity_type_id: ACTIVITY_TYPE__UPVOTE_NODE,
                activity_group_id: ActivityGroupDictionary.getUserInteractsWithBlockchainNode(),
                user_id_from: userId,
                entity_id_to: element,
                entity_name: BlockchainModelProvider.getEntityName(),
                event_id: eventId,
                // Not required fields
                signed_transaction: '',
                blockchain_response: '',
                blockchain_status: 0,
                entity_id_on: null,
                entity_name_on: null,
            });
        }
        return UsersActivityRepository.bulkCreateNewActivity(data, transaction);
    }
    static async processUserCancelVotesForBlockProducers(userId, blockchainNodeIds, transaction, eventId) {
        const data = [];
        for (const element of blockchainNodeIds) {
            data.push({
                activity_type_id: ACTIVITY_TYPE__CANCEL_NODE_UPVOTING_NODE,
                activity_group_id: ActivityGroupDictionary.getUserInteractsWithBlockchainNode(),
                user_id_from: userId,
                entity_id_to: element,
                entity_name: BlockchainModelProvider.getEntityName(),
                event_id: eventId,
                // Not required fields
                signed_transaction: '',
                blockchain_response: '',
                blockchain_status: 0,
                entity_id_on: null,
                entity_name_on: null,
            });
        }
        return UsersActivityRepository.bulkCreateNewActivity(data, transaction);
    }
    static async processNewOrganization(signedTransaction, currentUserId, newOrganizationId, transaction) {
        const data = {
            activity_type_id: ucom_libs_common_1.ContentTypesDictionary.getTypeOrganization(),
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
            activity_type_id: ucom_libs_common_1.ContentTypesDictionary.getTypeOrganization(),
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
            activity_type_id: ucom_libs_common_1.InteractionTypesDictionary.getOrgTeamInvitation(),
            activity_group_id: ActivityGroupDictionary.getGroupUsersTeamInvitation(),
            user_id_from: currentUserId,
            entity_id_to: targetUserId,
            entity_name: UsersModelProvider.getEntityName(),
            entity_id_on: newOrganizationId,
            entity_name_on: OrganizationsModelProvider.getEntityName(),
            signed_transaction: '',
            event_id: ucom_libs_common_1.EventsIdsDictionary.getOrgUsersTeamInvitation(),
        };
        return UsersActivityRepository.createNewActivity(data, transaction);
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
        return UsersActivityRepository.createNewKnexActivity(data, transaction);
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
        return UsersActivityRepository.createNewActivity(data, transaction);
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
        return UsersActivityRepository.createNewKnexActivity(data, transaction);
    }
    static async createForUserVotesComment(interactionType, signedTransaction, currentUserId, commentId, eventId, transaction) {
        const data = {
            activity_type_id: interactionType,
            activity_group_id: ActivityGroupDictionary.getGroupContentInteraction(),
            user_id_from: currentUserId,
            entity_id_to: commentId,
            entity_name: CommentsModelProvider.getEntityName(),
            signed_transaction: signedTransaction,
            event_id: eventId,
        };
        return UsersActivityRepository.createNewKnexActivity(data, transaction);
    }
    static async processOrganizationCreatesPost(newPost, eventId, signedTransaction, currentUserId, transaction = null) {
        const activityGroupId = ActivityGroupDictionary.getGroupContentCreationByOrganization();
        const entityName = PostsModelProvider.getEntityName();
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
        return UsersActivityRepository.createNewActivity(data, transaction);
    }
    static async processPostIsUpdated(updatedPost, currentUserId, eventId, transaction, signedTransaction = '') {
        const activityGroupId = ActivityGroupDictionary.getGroupContentUpdating();
        const entityName = PostsModelProvider.getEntityName();
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
        return UsersActivityRepository.createNewActivity(data, transaction);
    }
    static async processCommentIsUpdated(commentId, currentUserId, eventId, transaction, signedTransaction, commentableId, commentableName) {
        const activityGroupId = ActivityGroupDictionary.getGroupContentUpdating();
        const entityName = CommentsModelProvider.getEntityName();
        const data = {
            activity_type_id: eventId,
            activity_group_id: activityGroupId,
            user_id_from: currentUserId,
            entity_id_to: commentId,
            entity_name: entityName,
            event_id: eventId,
            signed_transaction: signedTransaction,
            entity_id_on: commentableId,
            entity_name_on: commentableName,
        };
        return UsersActivityRepository.createNewKnexActivity(data, transaction);
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
        const activityGroupId = ActivityGroupDictionary.getGroupContentCreationByOrganization();
        const entityName = PostsModelProvider.getEntityName();
        const entityNameOn = PostsModelProvider.getEntityName();
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
        return UsersActivityRepository.createNewActivity(data, transaction);
    }
    static async processUserHimselfCreatesPost(newPost, eventId, signedTransaction, currentUserId, transaction = null) {
        const activityGroupId = ActivityGroupDictionary.getGroupContentCreation();
        const entityName = PostsModelProvider.getEntityName();
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
        return UsersActivityRepository.createNewActivity(data, transaction);
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
        const activityGroupId = ActivityGroupDictionary.getGroupTagEvent();
        const postEntityName = PostsModelProvider.getEntityName();
        const userEntityName = UsersModelProvider.getEntityName();
        const eventId = ucom_libs_common_1.EventsIdsDictionary.getUserHasMentionedYouInPost();
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
        return UsersActivityRepository.createNewActivity(data, transaction);
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
        const activityGroupId = ActivityGroupDictionary.getGroupTagEvent();
        const entityNameOn = CommentsModelProvider.getEntityName();
        const userEntityName = UsersModelProvider.getEntityName();
        const eventId = ucom_libs_common_1.EventsIdsDictionary.getUserHasMentionedYouInComment();
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
        return UsersActivityRepository.createNewActivity(data, transaction);
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
        const activityGroupId = ActivityGroupDictionary.getGroupContentCreation();
        const entityName = PostsModelProvider.getEntityName();
        const entityNameOn = PostsModelProvider.getEntityName();
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
        return UsersActivityRepository.createNewActivity(data, transaction);
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
        const activityTypeId = ucom_libs_common_1.ContentTypesDictionary.getTypeComment();
        const commentsEntityName = CommentsModelProvider.getEntityName();
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
        return UsersActivityRepository.createNewActivity(data, transaction);
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
        const data = await UsersActivityRepository.findOneUserFollowActivityData(userId);
        // tslint:disable-next-line:variable-name
        const IFollow = [];
        const myFollowers = [];
        data.forEach((activity) => {
            activity.entity_id_to = +activity.entity_id_to;
            if (ucom_libs_common_1.InteractionTypesDictionary.isFollowActivity(activity)) {
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
        const activityTypeId = ucom_libs_common_1.InteractionTypesDictionary.getFollowId();
        await this.userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body);
    }
    static async userUnfollowsUser(userFrom, userIdTo, body) {
        const activityTypeId = ucom_libs_common_1.InteractionTypesDictionary.getUnfollowId();
        await this.userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body);
    }
    static async userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body) {
        await this.checkPreconditions(userFrom, userIdTo, activityTypeId);
        if (!body.signed_transaction) {
            throw new errors_1.BadRequestError(errors_1.getErrorMessagePair('signed_transaction', 'this field is required'));
        }
        const activity = await this.processUserFollowsOrUnfollowsUser(activityTypeId, body.signed_transaction, userFrom.id, userIdTo);
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(body.signed_transaction);
        await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
    }
    /**
     *
     * @param {Object} activity
     * @return {Promise<void>}
     */
    static async sendPayloadToRabbit(activity) {
        const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id);
        await ActivityProducer.publishWithUserActivity(jsonPayload);
    }
    static async sendPayloadToRabbitWithEosVersion(activity, signedTransaction) {
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(signedTransaction);
        this.sendPayloadToRabbitWithOptions(activity, options);
    }
    static async sendPayloadToRabbitEosV2(activity) {
        const jsonPayload = UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);
        await ActivityProducer.publishWithUserActivity(jsonPayload);
    }
    static async sendPayloadToRabbitEosV2WithSuppressEmpty(activity) {
        const options = {
            eosJsV2: true,
            suppressEmptyTransactionError: true,
        };
        const jsonPayload = UserActivitySerializer.createJobWithOptions(activity.id, options);
        await ActivityProducer.publishWithUserActivity(jsonPayload);
    }
    static async sendContentCreationPayloadToRabbit(activity) {
        const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id);
        await ActivityProducer.publishWithContentCreation(jsonPayload);
    }
    static async sendContentCreationPayloadToRabbitWithEosVersion(activity, signedTransactions) {
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(signedTransactions);
        await this.sendContentCreationPayloadToRabbitWithOptions(activity, options);
    }
    static async sendContentCreationPayloadToRabbitWithSuppressEmpty(activity) {
        const options = {
            eosJsV2: true,
            suppressEmptyTransactionError: true,
        };
        this.sendContentCreationPayloadToRabbitWithOptions(activity, options);
    }
    static async sendPayloadToRabbitWithOptions(activity, options) {
        const jsonPayload = UserActivitySerializer.createJobWithOptions(activity.id, options);
        await ActivityProducer.publishWithUserActivity(jsonPayload);
    }
    static async sendContentUpdatingPayloadToRabbitEosV2(activity) {
        const jsonPayload = UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);
        await ActivityProducer.publishWithContentUpdating(jsonPayload);
    }
    static async sendContentUpdatingPayloadToRabbitWithSuppressEmpty(activity) {
        const options = {
            eosJsV2: true,
            suppressEmptyTransactionError: true,
        };
        const jsonPayload = UserActivitySerializer.createJobWithOptions(activity.id, options);
        await ActivityProducer.publishWithContentUpdating(jsonPayload);
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
            throw new errors_1.BadRequestError({
                general: 'It is not possible to follow yourself',
            }, status('400'));
        }
        const currentFollowActivity = await UsersActivityRepository.getLastFollowOrUnfollowActivityForUser(userFrom.id, userIdTo);
        const currentFollowStatus = currentFollowActivity ? currentFollowActivity.activity_type_id : null;
        if (currentFollowStatus && currentFollowActivity.activity_type_id === activityTypeId) {
            throw new errors_1.BadRequestError({
                general: 'It is not possible to follow/unfollow twice',
            }, status('400'));
        }
        if (!ucom_libs_common_1.InteractionTypesDictionary.isOppositeActivityRequired(activityTypeId)) {
            return;
        }
        if (!currentFollowStatus || currentFollowStatus !== ucom_libs_common_1.InteractionTypesDictionary.getOppositeFollowActivityTypeId(activityTypeId)) {
            throw new errors_1.BadRequestError({
                general: 'It is not possible to unfollow before follow',
            }, status('400'));
        }
    }
    static async processUserFollowsOrUnfollowsUser(activityTypeId, signedTransaction, currentUserId, userIdTo) {
        const activityGroupId = ActivityGroupDictionary.getGroupUserUserInteraction();
        const entityName = UsersModelProvider.getEntityName();
        const eventId = activityTypeId === ucom_libs_common_1.InteractionTypesDictionary.getFollowId() ?
            ucom_libs_common_1.EventsIdsDictionary.getUserFollowsYou() : ucom_libs_common_1.EventsIdsDictionary.getUserUnfollowsYou();
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
        if (ucom_libs_common_1.EventsIdsDictionary.doesUserFollowOtherUser(eventId)) {
            await UsersActivityFollowRepository.insertOneFollowsOtherUser(userIdFrom, userIdTo, trx);
            return;
        }
        if (ucom_libs_common_1.EventsIdsDictionary.doesUserUnfollowOtherUser(eventId)) {
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
        await ActivityProducer.publishWithContentCreation(jsonPayload);
    }
}
module.exports = UserActivityService;
