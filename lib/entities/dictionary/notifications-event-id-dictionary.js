"use strict";
const errors_1 = require("../../api/errors");
const { Dictionary } = require('ucom-libs-wallet');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const ORG_USERS_TEAM_INVITATION = 10;
const USER_FOLLOWS_YOU = 30;
const USER_UPVOTES_YOUR_POST = 31;
const USER_DOWNVOTES_YOUR_POST = 32;
const USER_UPVOTES_YOUR_COMMENT = 33;
const USER_DOWNVOTES_YOUR_COMMENT = 34;
const USER_UNFOLLOWS_YOU = 35;
const USER_TRUSTS_YOU = 36;
const USER_UNTRUSTS_YOU = 37;
const USER_FOLLOWS_ORG = 50;
const USER_UPVOTES_ORG_POST = 51;
const USER_DOWNVOTES_ORG_POST = 52;
const USER_UPVOTES_ORG_COMMENT = 53;
const USER_DOWNVOTES_ORG_COMMENT = 54;
const USER_UNFOLLOWS_ORG = 55;
const USER_COMMENTS_YOUR_POST = 71;
const USER_LEAVES_COMMENT_ON_YOUR_COMMENT = 72;
const USER_REPOSTS_OTHER_USER_POST = 73;
const USER_CREATES_DIRECT_POST_FOR_ORG = 90;
const USER_COMMENTS_ORG_POST = 91;
const USER_LEAVES_COMMENT_ON_ORG_COMMENT = 92;
const USER_REPOSTS_ORG_POST = 93;
const USER_VOTES_FOR_BLOCKCHAIN_NODE = 110;
const USER_CANCEL_VOTE_FOR_BLOCKCHAIN_NODE = 111;
const USER_VOTES_FOR_CALCULATOR_NODE = 112;
const USER_CANCEL_VOTE_FOR_CALCULATOR_NODE = 113;
const USER_HAS_MENTIONED_YOU_IN_POST = 120;
const USER_HAS_MENTIONED_YOU_IN_COMMENT = 121;
const eventRequiresPrompt = [
    ORG_USERS_TEAM_INVITATION,
];
// #task - it is not a notification events. Here is event_id dictionary for users_activity
/**
 * @deprecated readonly
 * Consider to create new types inside a common lib (event-ids-dictionary)
 */
class NotificationsEventIdDictionary {
    static getUserHasMentionedYouInPost() {
        return USER_HAS_MENTIONED_YOU_IN_POST;
    }
    static getUserHasMentionedYouInComment() {
        return USER_HAS_MENTIONED_YOU_IN_COMMENT;
    }
    static getEventIdsRelatedToRepost() {
        return [
            USER_REPOSTS_OTHER_USER_POST,
            USER_REPOSTS_ORG_POST,
        ];
    }
    static getUpDownEventsByBlockchainNodesType(type) {
        let eventIdUp;
        let eventIdDown;
        switch (type) {
            case Dictionary.BlockchainNodes.typeBlockProducer():
                eventIdUp = NotificationsEventIdDictionary.getUserVotesForBlockchainNode();
                eventIdDown = NotificationsEventIdDictionary.getUserCancelVoteForBlockchainNode();
                break;
            case Dictionary.BlockchainNodes.typeCalculator():
                eventIdUp = NotificationsEventIdDictionary.getUserVotesForCalculatorNode();
                eventIdDown = NotificationsEventIdDictionary.getUserCancelVoteForCalculatorNode();
                break;
            default:
                throw new errors_1.AppError(`Unsupported blockchain node type: ${type}`);
        }
        return {
            eventIdUp,
            eventIdDown,
        };
    }
    static getAllBlockchainNodesVoteForEvents() {
        return [
            this.getUserVotesForBlockchainNode(),
            this.getUserVotesForCalculatorNode(),
        ];
    }
    static getAllBlockchainNodesCancelVoteEvents() {
        return [
            this.getUserCancelVoteForBlockchainNode(),
            this.getUserCancelVoteForCalculatorNode(),
        ];
    }
    static getAllBlockchainNodesVotingEvents() {
        return Array.prototype.concat(this.getAllBlockchainNodesVoteForEvents(), this.getAllBlockchainNodesCancelVoteEvents());
    }
    static getUserVotesForBlockchainNode() {
        return USER_VOTES_FOR_BLOCKCHAIN_NODE;
    }
    static getUserCancelVoteForBlockchainNode() {
        return USER_CANCEL_VOTE_FOR_BLOCKCHAIN_NODE;
    }
    static getUserVotesForCalculatorNode() {
        return USER_VOTES_FOR_CALCULATOR_NODE;
    }
    static getUserCancelVoteForCalculatorNode() {
        return USER_CANCEL_VOTE_FOR_CALCULATOR_NODE;
    }
    /**
     *
     * @return {number}
     */
    static getUserUpvotesPostOfOtherUser() {
        return USER_UPVOTES_YOUR_POST;
    }
    /**
     *
     * @return {number}
     */
    static getUserDownvotesPostOfOtherUser() {
        return USER_DOWNVOTES_YOUR_POST;
    }
    /**
     *
     * @return {number}
     */
    static getUserUpvotesPostOfOrg() {
        return USER_UPVOTES_ORG_POST;
    }
    /**
     *
     * @return {number}
     */
    static getUserDownvotesPostOfOrg() {
        return USER_DOWNVOTES_ORG_POST;
    }
    /**
     *
     * @return {number}
     */
    static getUserUpvotesCommentOfOrg() {
        return USER_UPVOTES_ORG_COMMENT;
    }
    /**
     *
     * @return {number}
     */
    static getUserDownvotesCommentOfOrg() {
        return USER_DOWNVOTES_ORG_COMMENT;
    }
    /**
     *
     * @return {number}
     */
    static getUserUpvotesCommentOfOtherUser() {
        return USER_UPVOTES_YOUR_COMMENT;
    }
    /**
     *
     * @return {number}
     */
    static getUserDownvotesCommentOfOtherUser() {
        return USER_DOWNVOTES_YOUR_COMMENT;
    }
    /**
     *
     * @return {number}
     */
    static getOrgUsersTeamInvitation() {
        return ORG_USERS_TEAM_INVITATION;
    }
    /**
     * @deprecated
     * @see EventsIds.userCreatesDirectPostForOtherUser()
     */
    static getUserCreatesDirectPostForOtherUser() {
        return EventsIds.userCreatesDirectPostForOtherUser();
    }
    /**
     *
     * @return {number}
     */
    static getUserCreatesDirectPostForOrg() {
        return USER_CREATES_DIRECT_POST_FOR_ORG;
    }
    /**
     *
     * @return {number}
     */
    static getUserFollowsYou() {
        return USER_FOLLOWS_YOU;
    }
    static getUserUnfollowsYou() {
        return USER_UNFOLLOWS_YOU;
    }
    static getUserTrustsYou() {
        return USER_TRUSTS_YOU;
    }
    static isUserTrustsYou(value) {
        return value === this.getUserTrustsYou();
    }
    static doesUserFollowOrg(value) {
        return value === this.getUserFollowsOrg();
    }
    static doesUserUnfollowOrg(value) {
        return value === this.getUserUnfollowsOrg();
    }
    static doesUserFollowOtherUser(value) {
        return value === this.getUserFollowsYou();
    }
    static doesUserUnfollowOtherUser(value) {
        return value === this.getUserUnfollowsYou();
    }
    static isUserUntrustsYou(value) {
        return value === this.getUserUntrustsYou();
    }
    static getUserUntrustsYou() {
        return USER_UNTRUSTS_YOU;
    }
    /**
     *
     * @return {number}
     */
    static getUserCommentsPost() {
        return USER_COMMENTS_YOUR_POST;
    }
    /**
     *
     * @return {number}
     */
    static getUserCommentsOrgPost() {
        return USER_COMMENTS_ORG_POST;
    }
    /**
     *
     * @return {number}
     */
    static getUserCommentsOrgComment() {
        return USER_LEAVES_COMMENT_ON_ORG_COMMENT;
    }
    /**
     *
     * @return {number}
     */
    static getUserCommentsComment() {
        return USER_LEAVES_COMMENT_ON_YOUR_COMMENT;
    }
    /**
     *
     * @return {number}
     */
    static getUserFollowsOrg() {
        return USER_FOLLOWS_ORG;
    }
    /**
     *
     * @return {number}
     */
    static getUserUnfollowsOrg() {
        return USER_UNFOLLOWS_ORG;
    }
    /**
     *
     * @param {Object} model
     * @return {boolean}
     */
    static doesEventRequirePrompt(model) {
        return ~eventRequiresPrompt.indexOf(model.event_id);
    }
    /**
     *
     * @param {Object} parentPostOrganizationId
     */
    static getRepostEventId(parentPostOrganizationId) {
        if (parentPostOrganizationId) {
            return this.getUserRepostsOrgPost();
        }
        return this.getUserRepostsOtherUserPost();
    }
    static getUserRepostsOtherUserPost() {
        return USER_REPOSTS_OTHER_USER_POST;
    }
    /**
     *
     * @return {number}
     */
    static getUserRepostsOrgPost() {
        return USER_REPOSTS_ORG_POST;
    }
}
module.exports = NotificationsEventIdDictionary;
