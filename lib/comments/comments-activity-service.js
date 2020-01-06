"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const errors_1 = require("../api/errors");
const CommentsRepository = require("./comments-repository");
const UserActivityService = require("../users/user-activity-service");
const EosTransactionService = require("../eos/eos-transaction-service");
const ActivityUserCommentRepository = require("../activity/activity-user-comment-repository");
const knex = require("../../config/knex");
const UsersActivityVoteRepository = require("../users/repository/users-activity/users-activity-vote-repository");
const EosContentInputProcessor = require("../eos/input-processor/content/eos-content-input-processor");
const { InteractionTypesDictionary } = require('ucom.libs.common');
class CommentsActivityService {
    static async userUpvotesComment(currentUser, commentId, body) {
        const interactionType = InteractionTypesDictionary.getUpvoteId();
        await this.userVotesComment(currentUser, commentId, interactionType, body);
        return this.getCurrentCommentVote(commentId);
    }
    static async userDownvotesComment(currentUser, commentId, body) {
        const interactionType = InteractionTypesDictionary.getDownvoteId();
        await this.userVotesComment(currentUser, commentId, interactionType, body);
        return this.getCurrentCommentVote(commentId);
    }
    static async preProcessCommentVoteAndGetCommentTo(currentUser, commentId, body) {
        const doesExists = await UsersActivityVoteRepository.doesUserVoteComment(currentUser.id, commentId);
        if (doesExists) {
            throw new errors_1.BadRequestError({
                general: 'Vote duplication is not allowed',
            });
        }
        const comment = await CommentsRepository.getModel().findOne({ where: { id: commentId } });
        if (comment.user_id === currentUser.id) {
            throw new errors_1.BadRequestError({
                general: 'It is not allowed to vote for your own comment',
            });
        }
        EosContentInputProcessor.isSignedTransactionOrError(body);
        return comment;
    }
    static async userVotesComment(currentUser, commentId, interactionType, body) {
        const comment = await this.preProcessCommentVoteAndGetCommentTo(currentUser, commentId, body);
        const eventId = this.getEventId(interactionType, comment);
        const activity = await knex.transaction(async (transaction) => {
            const [newActivity] = await Promise.all([
                UserActivityService.createForUserVotesComment(interactionType, body.signed_transaction, currentUser.id, comment.id, eventId, transaction),
                CommentsRepository.changeCurrentVotesByActivityType(comment.id, interactionType, transaction),
                UsersActivityVoteRepository.insertOneCommentVote(currentUser.id, comment.id, interactionType, transaction),
                ActivityUserCommentRepository.createNewActivity(currentUser, comment, interactionType, transaction),
            ]);
            return newActivity;
        });
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(body.signed_transaction);
        await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
    }
    static getEventId(interactionType, modelTo) {
        if (interactionType === InteractionTypesDictionary.getUpvoteId()) {
            if (modelTo.organization_id) {
                return ucom_libs_common_1.EventsIdsDictionary.getUserUpvotesCommentOfOrg();
            }
            return ucom_libs_common_1.EventsIdsDictionary.getUserUpvotesCommentOfOtherUser();
        }
        if (interactionType === InteractionTypesDictionary.getDownvoteId()) {
            if (modelTo.organization_id) {
                return ucom_libs_common_1.EventsIdsDictionary.getUserDownvotesCommentOfOrg();
            }
            return ucom_libs_common_1.EventsIdsDictionary.getUserDownvotesCommentOfOtherUser();
        }
        throw new Error(`Unsupported activityTypeId: ${interactionType}`);
    }
    static async getCurrentCommentVote(commentId) {
        const currentVote = await CommentsRepository.getCommentCurrentVote(commentId);
        return {
            current_vote: currentVote,
        };
    }
}
module.exports = CommentsActivityService;
