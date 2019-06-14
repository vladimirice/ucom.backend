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
const BLOCKCHAIN_IMPORTANCE_DELTA = 12;
const POST_UPVOTES_DELTA = 13;
const POST_ACTIVITY_INDEX_DELTA = 14;
const ORG_POSTS_TOTAL_AMOUNT_DELTA = 15;
const ORG_ACTIVITY_INDEX_DELTA = 16;
const TAG_ACTIVITY_INDEX_DELTA = 17;
const TAG_IMPORTANCE_DELTA = 18;
const TAG_POSTS_TOTAL_AMOUNT_DELTA = 19;
const USERS_POSTS_CURRENT_AMOUNT = 20;
const USER_HIMSELF_CURRENT_AMOUNTS = 21;
const USERS_POSTS_TOTAL_AMOUNT_DELTA = 22;
const USERS_SCALED_IMPORTANCE_DELTA = 23;
const USERS_SCALED_SOCIAL_RATE_DELTA = 24;
/** Exact event description */
class EventParamTypeDictionary {
    static getTagItselfCurrentAmounts() {
        return TAG_ITSELF_CURRENT_AMOUNTS;
    }
    static getUserHimselfCurrentAmounts() {
        return USER_HIMSELF_CURRENT_AMOUNTS;
    }
    static getOrgFollowersCurrentAmount() {
        return ORG_FOLLOWERS_CURRENT_AMOUNT;
    }
    static getOrgPostsCurrentAmount() {
        return ORG_POSTS_CURRENT_AMOUNT;
    }
    static getUsersPostsCurrentAmount() {
        return USERS_POSTS_CURRENT_AMOUNT;
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
    static getBlockchainImportanceDelta() {
        return BLOCKCHAIN_IMPORTANCE_DELTA;
    }
    static getPostUpvotesDelta() {
        return POST_UPVOTES_DELTA;
    }
    static getPostActivityIndexDelta() {
        return POST_ACTIVITY_INDEX_DELTA;
    }
    static getOrgsActivityIndexDelta() {
        return ORG_ACTIVITY_INDEX_DELTA;
    }
    static getTagsActivityIndexDelta() {
        return TAG_ACTIVITY_INDEX_DELTA;
    }
    static getOrgPostsTotalAmountDelta() {
        return ORG_POSTS_TOTAL_AMOUNT_DELTA;
    }
    static getUsersPostsTotalAmountDelta() {
        return USERS_POSTS_TOTAL_AMOUNT_DELTA;
    }
    static getTagsImportanceDelta() {
        return TAG_IMPORTANCE_DELTA;
    }
    static getUsersScaledImportanceDelta() {
        return USERS_SCALED_IMPORTANCE_DELTA;
    }
    static getUsersScaledSocialRateDelta() {
        return USERS_SCALED_SOCIAL_RATE_DELTA;
    }
    static getTagPostsTotalAmountDelta() {
        return TAG_POSTS_TOTAL_AMOUNT_DELTA;
    }
}
module.exports = EventParamTypeDictionary;
