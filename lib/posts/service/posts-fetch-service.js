"use strict";
const winston_1 = require("../../../config/winston");
const PostsRepository = require("../posts-repository");
const OrganizationsRepository = require("../../organizations/repository/organizations-repository");
const UsersFeedRepository = require("../../common/repository/users-feed-repository");
const ApiPostProcessor = require("../../common/service/api-post-processor");
const queryFilterService = require('../../api/filters/query-filter-service');
const usersActivityRepository = require('../../users/repository/users-activity-repository');
const commentsFetchService = require('../../comments/service/comments-fetch-service');
/**
 * This service never changes any persistent data (ex. object properties in DB)
 */
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
    static async findManyPosts(query, currentUserId) {
        const repository = PostsRepository;
        const params = queryFilterService.getQueryParametersWithRepository(query, repository);
        queryFilterService.processWithIncludeProcessor(repository, query, params);
        const findCountPromises = this.getFindCountPromisesForAllPosts(params);
        return this.findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
    }
    static async findAndProcessAllForUserWallFeed(userId, currentUserId, query) {
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
    static getFindCountPromisesForAllPosts(params) {
        return [
            PostsRepository.findAllPosts(params),
            PostsRepository.countAllPosts(params),
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
            await this.addCommentsToPosts(posts, postsIds, query.included_query.comments, currentUserId);
        }
        const data = ApiPostProcessor.processManyPosts(posts, currentUserId, userActivity);
        const metadata = queryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
    static async addCommentsToPosts(posts, postsIds, commentsQuery, currentUserId) {
        commentsQuery.depth = 0;
        const idToComments = await commentsFetchService.findAndProcessCommentsByPostsIds(postsIds, currentUserId, commentsQuery);
        posts.forEach((post) => {
            if (!idToComments[post.id]) {
                winston_1.ApiLogger.error(`There are no comments for post with ID ${post.id} but should be. Filled or empty. Let's set empty and continue`);
                post.comments = ApiPostProcessor.getEmptyListOfModels();
            }
            else {
                post.comments = idToComments[post.id];
            }
        });
    }
}
module.exports = PostsFetchService;
