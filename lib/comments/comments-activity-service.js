"use strict";
const activityUserCommentRepository = require('../activity/activity-user-comment-repository');
const usersActivityService = require('../users/user-activity-service');
// @ts-ignore
const { BadRequestError } = require('../api/errors');
const eosService = require('../eos/eos-transaction-service');
const commentsRepository = require('./repository').Main;
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const eventIdDictionary = require('../entities/dictionary').EventId;
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
        await commentsRepository.incrementCurrentVoteCounter(modelIdTo);
        const currentVote = await commentsRepository.getCommentCurrentVote(modelIdTo);
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
        await commentsRepository.decrementCurrentVoteCounter(modelIdTo);
        const currentVote = await commentsRepository.getCommentCurrentVote(modelIdTo);
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
    static async doesUserVoteComment(userIdFrom, commentIdTo) {
        return await activityUserCommentRepository.doesUserVoteComment(userIdFrom, commentIdTo);
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
        const doesExists = await CommentsActivityService.doesUserVoteComment(userFrom.id, modelIdTo);
        if (doesExists) {
            throw new BadRequestError({
                general: 'Vote duplication is not allowed',
            });
        }
        const modelTo = await commentsRepository.getModel().findOne({ where: { id: modelIdTo } });
        if (modelTo.user_id === userFrom.id) {
            throw new BadRequestError({
                general: 'It is not allowed to vote for your own comment',
            });
        }
        await eosService.appendSignedUserVotesContent(userFrom, body, modelTo.blockchain_id, activityTypeId);
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
        await activityUserCommentRepository.createNewActivity(userFrom.id, modelTo.id, activityTypeId);
        const eventId = this.getEventId(activityTypeId, modelTo);
        // but also lets write in new table
        const activity = await usersActivityService.createForUserVotesComment(activityTypeId, signedTransaction, userFrom.id, modelTo.id, eventId);
        await usersActivityService.sendPayloadToRabbit(activity);
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
                return eventIdDictionary.getUserUpvotesCommentOfOrg();
            }
            return eventIdDictionary.getUserUpvotesCommentOfOtherUser();
        }
        if (activityTypeId === InteractionTypeDictionary.getDownvoteId()) {
            if (modelTo.organization_id) {
                return eventIdDictionary.getUserDownvotesCommentOfOrg();
            }
            return eventIdDictionary.getUserDownvotesCommentOfOtherUser();
        }
        throw new Error(`Unsupported activityTypeId: ${activityTypeId}`);
    }
}
module.exports = CommentsActivityService;
