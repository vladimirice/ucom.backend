"use strict";
const errors_1 = require("../api/errors");
const EosTransactionService = require("../eos/eos-transaction-service");
const PostsRepository = require("./posts-repository");
const NotificationsEventIdDictionary = require("../entities/dictionary/notifications-event-id-dictionary");
const UserActivityService = require("../users/user-activity-service");
const knex = require("../../config/knex");
const UsersActivityVoteRepository = require("../users/repository/users-activity/users-activity-vote-repository");
const EosContentInputProcessor = require("../eos/input-processor/content/eos-content-input-processor");
const { InteractionTypesDictionary } = require('ucom.libs.common');
class PostActivityService {
    static async userUpvotesPost(currentUser, postId, body) {
        const interactionType = InteractionTypesDictionary.getUpvoteId();
        await this.userVotesPost(currentUser, postId, interactionType, body);
        return this.getCurrentVote(postId);
    }
    static async userDownvotesPost(currentUser, postId, body) {
        const interactionType = InteractionTypesDictionary.getDownvoteId();
        await this.userVotesPost(currentUser, postId, interactionType, body);
        return this.getCurrentVote(postId);
    }
    static async checkVotePreconditionsAndGetModelTo(currentUser, postId, body) {
        const doesExists = await UsersActivityVoteRepository.doesUserVotePost(currentUser.id, postId);
        if (doesExists) {
            throw new errors_1.BadRequestError({
                general: 'Vote duplication is not allowed',
            });
        }
        const post = await PostsRepository.findOneById(postId);
        if (post.user_id === currentUser.id) {
            throw new errors_1.BadRequestError({
                general: 'It is not allowed to vote for your own comment',
            });
        }
        EosContentInputProcessor.isSignedTransactionOrError(body);
        return post;
    }
    static async userVotesPost(currentUser, postId, interactionType, body) {
        const post = await this.checkVotePreconditionsAndGetModelTo(currentUser, postId, body);
        const eventId = this.getEventId(interactionType, post);
        const activity = await knex.transaction(async (transaction) => {
            const [newActivity] = await Promise.all([
                UserActivityService.createForUserVotesPost(interactionType, body.signed_transaction, currentUser.id, post.id, eventId, transaction),
                PostsRepository.changeCurrentVotesByActivityType(post.id, interactionType, transaction),
                UsersActivityVoteRepository.insertOnePostVote(currentUser.id, post.id, interactionType, transaction),
            ]);
            return newActivity;
        });
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(body.signed_transaction);
        await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
    }
    static getEventId(interactionType, modelTo) {
        if (interactionType === InteractionTypesDictionary.getUpvoteId()) {
            if (modelTo.organization_id) {
                return NotificationsEventIdDictionary.getUserUpvotesPostOfOrg();
            }
            return NotificationsEventIdDictionary.getUserUpvotesPostOfOtherUser();
        }
        if (interactionType === InteractionTypesDictionary.getDownvoteId()) {
            if (modelTo.organization_id) {
                return NotificationsEventIdDictionary.getUserDownvotesPostOfOrg();
            }
            return NotificationsEventIdDictionary.getUserDownvotesPostOfOtherUser();
        }
        throw new Error(`Unsupported activityTypeId: ${interactionType}`);
    }
    static async getCurrentVote(postId) {
        const currentVote = await PostsRepository.getPostCurrentVote(postId);
        return {
            current_vote: currentVote,
        };
    }
}
module.exports = PostActivityService;
