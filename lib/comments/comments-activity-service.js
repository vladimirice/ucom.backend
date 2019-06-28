"use strict";
const errors_1 = require("../api/errors");
const CommentsRepository = require("./comments-repository");
const NotificationsEventIdDictionary = require("../entities/dictionary/notifications-event-id-dictionary");
const UserActivityService = require("../users/user-activity-service");
const EosTransactionService = require("../eos/eos-transaction-service");
const ActivityUserCommentRepository = require("../activity/activity-user-comment-repository");
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
class CommentsActivityService {
    /**
     *
     * @param {Object} userFrom
     * @param {number} modelIdTo
     * @param {Object} body
     * @returns {Promise<void>}
     */
    static async userUpvotesComment(userFrom, modelIdTo, body) {
        // #task need DB transaction
        const activityTypeId = InteractionTypeDictionary.getUpvoteId();
        const modelTo = await this.preProcessCommentVoteAndGetCommentTo(userFrom, modelIdTo, body, activityTypeId);
        await this.userVotesComment(userFrom, modelTo, activityTypeId, body.signed_transaction);
        await CommentsRepository.incrementCurrentVoteCounter(modelIdTo);
        const currentVote = await CommentsRepository.getCommentCurrentVote(modelIdTo);
        return {
            current_vote: currentVote,
        };
    }
    /**
     *
     * @param {Object} userFrom
     * @param {number} modelIdTo
     * @param {Object} body
     * @returns {Promise<void>}
     */
    static async userDownvotesComment(userFrom, modelIdTo, body) {
        const activityTypeId = InteractionTypeDictionary.getDownvoteId();
        const modelTo = await this.preProcessCommentVoteAndGetCommentTo(userFrom, modelIdTo, body, activityTypeId);
        await this.userVotesComment(userFrom, modelTo, activityTypeId, body.signed_transaction);
        await CommentsRepository.decrementCurrentVoteCounter(modelIdTo);
        const currentVote = await CommentsRepository.getCommentCurrentVote(modelIdTo);
        return {
            current_vote: currentVote,
        };
    }
    /**
     *
     * @param {number} userIdFrom
     * @param {number} commentIdTo
     * @returns {Promise<boolean>}
     */
    static async doUserVoteComment(userIdFrom, commentIdTo) {
        return ActivityUserCommentRepository.doesUserVoteComment(userIdFrom, commentIdTo);
    }
    /**
     *
     * @param {Object} userFrom
     * @param {number} modelIdTo
     * @param {Object} body
     * @param {number} activityTypeId
     * @returns {Promise<Object>}
     * @private
     */
    static async preProcessCommentVoteAndGetCommentTo(userFrom, modelIdTo, body, activityTypeId) {
        const doesExists = await CommentsActivityService.doUserVoteComment(userFrom.id, modelIdTo);
        if (doesExists) {
            throw new errors_1.BadRequestError({
                general: 'Vote duplication is not allowed',
            });
        }
        const modelTo = await CommentsRepository.getModel().findOne({ where: { id: modelIdTo } });
        if (modelTo.user_id === userFrom.id) {
            throw new errors_1.BadRequestError({
                general: 'It is not allowed to vote for your own comment',
            });
        }
        await EosTransactionService.appendSignedUserVotesContent(userFrom, body, modelTo.blockchain_id, activityTypeId);
        return modelTo;
    }
    /**
     *
     * @param {Object} userFrom
     * @param {Object} modelTo
     * @param {number} activityTypeId
     * @param {string} signedTransaction
     * @returns {Promise<void>}
     * @private
     */
    static async userVotesComment(userFrom, modelTo, activityTypeId, signedTransaction) {
        // #task should preserve old logic due to statistics - still used
        await ActivityUserCommentRepository.createNewActivity(userFrom.id, modelTo.id, activityTypeId);
        const eventId = this.getEventId(activityTypeId, modelTo);
        // but also lets write in new table
        const activity = await UserActivityService.createForUserVotesComment(activityTypeId, signedTransaction, userFrom.id, modelTo.id, eventId);
        await UserActivityService.sendPayloadToRabbit(activity);
    }
    /**
     *
     * @param {number} activityTypeId
     * @param {Object} modelTo
     * @return {number}
     * @private
     */
    static getEventId(activityTypeId, modelTo) {
        if (activityTypeId === InteractionTypeDictionary.getUpvoteId()) {
            if (modelTo.organization_id) {
                return NotificationsEventIdDictionary.getUserUpvotesCommentOfOrg();
            }
            return NotificationsEventIdDictionary.getUserUpvotesCommentOfOtherUser();
        }
        if (activityTypeId === InteractionTypeDictionary.getDownvoteId()) {
            if (modelTo.organization_id) {
                return NotificationsEventIdDictionary.getUserDownvotesCommentOfOrg();
            }
            return NotificationsEventIdDictionary.getUserDownvotesCommentOfOtherUser();
        }
        throw new Error(`Unsupported activityTypeId: ${activityTypeId}`);
    }
}
module.exports = CommentsActivityService;
