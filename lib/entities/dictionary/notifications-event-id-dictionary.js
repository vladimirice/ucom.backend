"use strict";
const ORG_USERS_TEAM_INVITATION = 10;
const USER_FOLLOWS_YOU = 30;
const USER_UPVOTES_YOUR_POST = 31;
const USER_DOWNVOTES_YOUR_POST = 32;
const USER_UPVOTES_YOUR_COMMENT = 33;
const USER_DOWNVOTES_YOUR_COMMENT = 34;
const USER_UNFOLLOWS_YOU = 35;
const USER_FOLLOWS_ORG = 50;
const USER_UPVOTES_ORG_POST = 51;
const USER_DOWNVOTES_ORG_POST = 52;
const USER_UPVOTES_ORG_COMMENT = 53;
const USER_DOWNVOTES_ORG_COMMENT = 54;
const USER_UNFOLLOWS_ORG = 55;
const USER_CREATES_DIRECT_POST_FOR_YOU = 70;
const USER_COMMENTS_YOUR_POST = 71;
const USER_LEAVES_COMMENT_ON_YOUR_COMMENT = 72;
const USER_REPOSTS_OTHER_USER_POST = 73;
const USER_CREATES_DIRECT_POST_FOR_ORG = 90;
const USER_COMMENTS_ORG_POST = 91;
const USER_LEAVES_COMMENT_ON_ORG_COMMENT = 92;
const USER_REPOSTS_ORG_POST = 93;
const USER_VOTES_FOR_BLOCKCHAIN_NODE = 110;
const USER_CANCEL_VOTE_FOR_BLOCKCHAIN_NODE = 111;
const USER_HAS_MENTIONED_YOU_IN_POST = 120;
const USER_HAS_MENTIONED_YOU_IN_COMMENT = 121;
const eventRequiresPrompt = [
    ORG_USERS_TEAM_INVITATION,
];
class NotificationsEventIdDictionary {
    /**
     *
     * @returns {number}
     */
    static getUserHasMentionedYouInPost() {
        return USER_HAS_MENTIONED_YOU_IN_POST;
    }
    /**
     *
     * @returns {number}
     */
    static getUserHasMentionedYouInComment() {
        return USER_HAS_MENTIONED_YOU_IN_COMMENT;
    }
    /**
     *
     * @return {number[]}
     */
    static getEventIdsRelatedToRepost() {
        return [
            USER_REPOSTS_OTHER_USER_POST,
            USER_REPOSTS_ORG_POST,
        ];
    }
    /**
     *
     * @return {number}
     */
    static getUserVotesForBlockchainNode() {
        return USER_VOTES_FOR_BLOCKCHAIN_NODE;
    }
    /**
     *
     * @return {number}
     */
    static getUserCancelVoteForBlockchainNode() {
        return USER_CANCEL_VOTE_FOR_BLOCKCHAIN_NODE;
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
     *
     * @return {number}
     */
    static getUserCreatesDirectPostForOtherUser() {
        return USER_CREATES_DIRECT_POST_FOR_YOU;
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
    /**
     *
     * @return {number}
     */
    static getUserUnfollowsYou() {
        return USER_UNFOLLOWS_YOU;
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
    static isUserCommentsOrgComment(model) {
        return model.event_id === USER_LEAVES_COMMENT_ON_ORG_COMMENT;
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
    static isTargetEntityRecipient(model) {
        const set = [
            ORG_USERS_TEAM_INVITATION,
            USER_FOLLOWS_YOU,
        ];
        return ~set.indexOf(model.event_id);
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
    /**
     *
     * @return {number}
     */
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
