"use strict";
const EosTransactionService = require("../eos/eos-transaction-service");
const PostsRepository = require("./posts-repository");
const NotificationsEventIdDictionary = require("../entities/dictionary/notifications-event-id-dictionary");
const UserActivityService = require("../users/user-activity-service");
const knex = require("../../config/knex");
const UsersActivityVoteRepository = require("../users/repository/users-activity/users-activity-vote-repository");
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const { BadRequestError: badRequestError } = require('../api/errors');
class PostActivityService {
    static async userUpvotesPost(currentUser, postId, body) {
        const interactionType = InteractionTypeDictionary.getUpvoteId();
        await this.userVotesPost(currentUser, postId, interactionType, body);
        return this.getCurrentVote(postId);
    }
    static async userDownvotesPost(currentUser, postId, body) {
        const interactionType = InteractionTypeDictionary.getDownvoteId();
        await this.userVotesPost(currentUser, postId, interactionType, body);
        return this.getCurrentVote(postId);
    }
    static async checkVotePreconditionsAndGetModelTo(currentUser, postId, body, interactionType) {
        const doesExists = await UsersActivityVoteRepository.doesUserVotePost(currentUser.id, postId);
        if (doesExists) {
            // eslint-disable-next-line new-cap
            throw new badRequestError({
                general: 'Vote duplication is not allowed',
            });
        }
        const post = await PostsRepository.findOneById(postId);
        if (post.user_id === currentUser.id) {
            // eslint-disable-next-line new-cap
            throw new badRequestError({
                general: 'It is not allowed to vote for your own comment',
            });
        }
        await EosTransactionService.appendSignedUserVotesContent(currentUser, body, post.blockchain_id, interactionType);
        return post;
    }
    static async userVotesPost(currentUser, postId, interactionType, body) {
        const post = await this.checkVotePreconditionsAndGetModelTo(currentUser, postId, body, interactionType);
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
        if (interactionType === InteractionTypeDictionary.getUpvoteId()) {
            if (modelTo.organization_id) {
                return NotificationsEventIdDictionary.getUserUpvotesPostOfOrg();
            }
            return NotificationsEventIdDictionary.getUserUpvotesPostOfOtherUser();
        }
        if (interactionType === InteractionTypeDictionary.getDownvoteId()) {
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
