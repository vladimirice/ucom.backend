"use strict";
const CURRENT_BLOCKCHAIN_IMPORTANCE = 1;
const POST_VOTES_CURRENT_AMOUNT = 3;
const POST_REPOSTS_CURRENT_AMOUNT = 4;
const POST_COMMENTS_CURRENT_AMOUNT = 5;
const ORG_POSTS_CURRENT_AMOUNT = 6;
const ORG_FOLLOWERS_CURRENT_AMOUNT = 7;
const TAG_ITSELF_CURRENT_AMOUNTS = 8;
const POST_CURRENT_ACTIVITY_INDEX = 9;
const ORG_CURRENT_ACTIVITY_INDEX = 10;
const TAG_CURRENT_ACTIVITY_INDEX = 11;
/** Exact event description */
class EventParamTypeDictionary {
    static getTagItselfCurrentAmounts() {
        return TAG_ITSELF_CURRENT_AMOUNTS;
    }
    static getOrgFollowersCurrentAmount() {
        return ORG_FOLLOWERS_CURRENT_AMOUNT;
    }
    static getOrgPostsCurrentAmount() {
        return ORG_POSTS_CURRENT_AMOUNT;
    }
    static getPostVotesCurrentAmount() {
        return POST_VOTES_CURRENT_AMOUNT;
    }
    static getPostRepostsCurrentAmount() {
        return POST_REPOSTS_CURRENT_AMOUNT;
    }
    static getPostCommentsCurrentAmount() {
        return POST_COMMENTS_CURRENT_AMOUNT;
    }
    static getPostCurrentActivityIndex() {
        return POST_CURRENT_ACTIVITY_INDEX;
    }
    static getOrgCurrentActivityIndex() {
        return ORG_CURRENT_ACTIVITY_INDEX;
    }
    static getTagCurrentActivityIndex() {
        return TAG_CURRENT_ACTIVITY_INDEX;
    }
    static getCurrentBlockchainImportance() {
        return CURRENT_BLOCKCHAIN_IMPORTANCE;
    }
}
module.exports = EventParamTypeDictionary;
