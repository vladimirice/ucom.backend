"use strict";
const PostsRepository = require("../posts-repository");
const OrganizationsRepository = require("../../organizations/repository/organizations-repository");
const UsersFeedRepository = require("../../common/repository/users-feed-repository");
const ApiPostProcessor = require("../../common/service/api-post-processor");
const queryFilterService = require('../../api/filters/query-filter-service');
const usersActivityRepository = require('../../users/repository/users-activity-repository');
const commentsFetchService = require('../../comments/service/comments-fetch-service');
class PostsFetchService {
    /**
     * deprecated - only for old APIs
     * @param postId
     * @param currentUserId
     */
    static async findOnePostByIdAndProcess(postId, currentUserId) {
        const post = await PostsRepository.findOneById(postId, currentUserId, true);
        if (!post) {
            return null;
        }
        let userToUserActivity = null;
        let currentUserPostActivity = null;
        if (currentUserId) {
            userToUserActivity =
                await usersActivityRepository.findOneUserActivityWithInvolvedUsersData(post.user_id);
            const postsActivity = await usersActivityRepository.findOneUserToPostsVotingAndRepostActivity(currentUserId, [postId]);
            currentUserPostActivity = {
                posts: postsActivity,
            };
        }
        let orgTeamMembers = [];
        if (post.organization_id) {
            orgTeamMembers = await OrganizationsRepository.findAllTeamMembersIds(post.organization_id);
        }
        return ApiPostProcessor.processOnePostFully(post, currentUserId, currentUserPostActivity, userToUserActivity, orgTeamMembers);
    }
    static async findOnePostByIdAndProcessV2(postId, currentUserId, commentsQuery) {
        const post = await PostsRepository.findOneByIdV2(postId, true);
        if (!post) {
            return null;
        }
        let userToUserActivity = null;
        let currentUserPostActivity = null;
        if (currentUserId) {
            userToUserActivity =
                await usersActivityRepository.findOneUserActivityWithInvolvedUsersData(post.user_id);
            const postsActivity = await usersActivityRepository.findOneUserToPostsVotingAndRepostActivity(currentUserId, [postId]);
            currentUserPostActivity = {
                posts: postsActivity,
            };
        }
        let orgTeamMembers = [];
        if (post.organization_id) {
            orgTeamMembers = await OrganizationsRepository.findAllTeamMembersIds(post.organization_id);
        }
        ApiPostProcessor.processOnePostFully(post, currentUserId, currentUserPostActivity, userToUserActivity, orgTeamMembers);
        post.comments = await commentsFetchService.findAndProcessCommentsByPostId(postId, currentUserId, commentsQuery);
        return post;
    }
    static async findAndProcessAllForUserWallFeed(userId, currentUserId, query = null) {
        const params = queryFilterService.getQueryParameters(query);
        const includeProcessor = UsersFeedRepository.getIncludeProcessor();
        includeProcessor(query, params);
        const findCountPromises = [
            UsersFeedRepository.findAllForUserWallFeed(userId, params),
            UsersFeedRepository.countAllForUserWallFeed(userId),
        ];
        return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
    }
    static async findAndProcessAllForOrgWallFeed(orgId, currentUserId, query) {
        const params = queryFilterService.getQueryParameters(query);
        queryFilterService.processWithIncludeProcessor(UsersFeedRepository, query, params);
        const findCountPromises = this.getFindCountPromisesForOrg(orgId, params);
        return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
    }
    /**
     *
     * @param {Object} query
     * @param {number} currentUserId
     * @return {Promise<any>}
     */
    static async findAndProcessAllForMyselfNewsFeed(query, currentUserId) {
        const params = queryFilterService.getQueryParameters(query);
        const includeProcessor = UsersFeedRepository.getIncludeProcessor();
        includeProcessor(query, params);
        const { orgIds, usersIds } = await usersActivityRepository.findOneUserFollowActivity(currentUserId);
        const findCountPromises = [
            UsersFeedRepository.findAllForUserNewsFeed(currentUserId, usersIds, orgIds, params),
            UsersFeedRepository.countAllForUserNewsFeed(currentUserId, usersIds, orgIds),
        ];
        return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
    }
    static async findAndProcessAllForTagWallFeed(tagTitle, currentUserId, query) {
        const params = queryFilterService.getQueryParameters(query);
        queryFilterService.processWithIncludeProcessor(UsersFeedRepository, query, params);
        const findCountPromises = this.getFindCountPromisesForTag(tagTitle, params);
        return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
    }
    static getFindCountPromisesForOrg(orgId, params) {
        return [
            UsersFeedRepository.findAllForOrgWallFeed(orgId, params),
            UsersFeedRepository.countAllForOrgWallFeed(orgId),
        ];
    }
    static getFindCountPromisesForTag(tagTitle, params) {
        return [
            UsersFeedRepository.findAllPostsForWallFeedByTag(tagTitle, params),
            UsersFeedRepository.countAllPostsForWallFeedByTag(tagTitle),
        ];
    }
    /**
     *
     * @param {Object} query
     * @param {Object} params
     * @param {number} currentUserId
     * @param {Promise[]} findCountPromises
     * @return {Promise<any>}
     * @private
     */
    static async findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises) {
        const [posts, totalAmount] = await Promise.all(findCountPromises);
        const idToPost = {};
        const postsIds = [];
        // @ts-ignore
        for (const post of posts) {
            idToPost[post.id] = post;
            postsIds.push(+post.id);
        }
        let userActivity;
        if (currentUserId) {
            const postsActivity = await usersActivityRepository.findOneUserToPostsVotingAndRepostActivity(currentUserId, postsIds);
            userActivity = {
                posts: postsActivity,
            };
        }
        // #task - use included query
        if (query && query.included_query && query.included_query.comments) {
            // #task - prototype realization for demo, N+1 issue
            for (const id of postsIds) {
                // #task - should be defined as default parameters for comments pagination
                const commentsQuery = query.included_query.comments;
                commentsQuery.depth = 0;
                idToPost[id].comments = await commentsFetchService.findAndProcessCommentsByPostId(id, currentUserId, commentsQuery);
            }
        }
        const data = ApiPostProcessor.processManyPosts(posts, currentUserId, userActivity);
        const metadata = queryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
}
module.exports = PostsFetchService;
