"use strict";
const winston_1 = require("../../../config/winston");
const errors_1 = require("../../api/errors");
const PostsRepository = require("../posts-repository");
const OrganizationsRepository = require("../../organizations/repository/organizations-repository");
const UsersFeedRepository = require("../../common/repository/users-feed-repository");
const ApiPostProcessor = require("../../common/service/api-post-processor");
const UsersModelProvider = require("../../users/users-model-provider");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const OrganizationsFetchService = require("../../organizations/service/organizations-fetch-service");
const UsersFetchService = require("../../users/service/users-fetch-service");
const EntityListCategoryDictionary = require("../../stats/dictionary/entity-list-category-dictionary");
const PostsModelProvider = require("./posts-model-provider");
const AirdropFetchService = require("../../airdrops/service/airdrop-fetch-service");
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const queryFilterService = require('../../api/filters/query-filter-service');
const usersActivityRepository = require('../../users/repository/users-activity-repository');
const commentsFetchService = require('../../comments/service/comments-fetch-service');
/**
 * This service never changes any persistent data (ex. object properties in DB)
 */
class PostsFetchService {
    static isDirectPost(post) {
        return post.post_type_id === ContentTypeDictionary.getTypeDirectPost();
    }
    /**
     * @param postId
     * @param currentUserId
     */
    static async findOnePostByIdAndProcess(postId, currentUserId) {
        const post = await PostsRepository.findOneById(postId, currentUserId, true);
        if (!post) {
            return null;
        }
        const entityFor = await this.getEntityFor(post);
        if (entityFor) {
            post.entity_for_card = await this.getEntityFor(post);
        }
        await this.processEntityForCardForRepost(post);
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
    static async findOnePostOfferWithAirdrop(postId, currentUserId, commentsQuery, usersRequestQuery) {
        const post = await this.findOnePostByIdAndProcessV2(postId, currentUserId, commentsQuery);
        if (!post) {
            throw new errors_1.BadRequestError(`There is no post with ID: ${postId}`, 404);
        }
        await AirdropFetchService.addDataForGithubAirdropOffer(post, currentUserId, usersRequestQuery);
        return post;
    }
    static async findOnePostByIdAndProcessV2(postId, currentUserId, commentsQuery) {
        const post = await PostsRepository.findOneByIdV2(postId, true);
        if (!post) {
            throw new errors_1.BadRequestError(`There is no post with ID: ${postId}`, 404);
        }
        const entityFor = await this.getEntityFor(post);
        if (entityFor) {
            post.entity_for_card = await this.getEntityFor(post);
        }
        await this.processEntityForCardForRepost(post);
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
        this.processForTrendingAndHotBackwardCompatibility(query);
        const params = queryFilterService.getQueryParametersWithRepository(query, repository);
        queryFilterService.processWithIncludeProcessor(repository, query, params);
        if (query.entity_state === 'card') {
            params.attributes = PostsModelProvider.getPostsFieldsForCard();
        }
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
    static async processEntityForCardForRepost(post) {
        // #task - it is not optimal. Here is N+1 problem. it is required to use JOIN or REDIS cache
        if (post.post_type_id !== ContentTypeDictionary.getTypeRepost()) {
            return;
        }
        post.post.entity_for_card = await this.getEntityFor(post.post);
    }
    static async getEntityFor(post) {
        switch (post.entity_name_for) {
            case UsersModelProvider.getEntityName():
                return UsersFetchService.findOneAndProcessForCard(post.entity_id_for);
            case OrganizationsModelProvider.getEntityName():
                return OrganizationsFetchService.findOneAndProcessForCard(post.entity_id_for);
            default:
                throw new errors_1.AppError(`Unsupported entity_name_for: ${post.entity_name_for}`, 500);
        }
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
        if (currentUserId && query.entity_state !== 'card') {
            const postsActivity = await usersActivityRepository.findOneUserToPostsVotingAndRepostActivity(currentUserId, postsIds);
            userActivity = {
                posts: postsActivity,
            };
        }
        if (query && query.included_query && query.included_query.comments) {
            await this.addCommentsToPosts(posts, postsIds, query.included_query.comments, currentUserId);
        }
        const data = ApiPostProcessor.processManyPosts(posts, currentUserId, userActivity);
        if (query.entity_state !== 'card') {
            await this.addEntityForCard(posts, data);
            for (const post of posts) {
                await this.processEntityForCardForRepost(post);
            }
        }
        const metadata = queryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
    static async addEntityForCard(posts, data) {
        // #task - maybe use JOIN instead (knex and good hydration is required) or provide Card REDIS caching
        const postIdToEntityForCard = await this.getPostIdToEntityForCard(posts);
        data.forEach((post) => {
            if (postIdToEntityForCard[post.id]) {
                post.entity_for_card = postIdToEntityForCard[post.id];
            }
            else {
                winston_1.ApiLogger.error(`there is no entityForCard record for post: ${JSON.stringify(post)}. Skipped...`);
            }
        });
    }
    static async getPostIdToEntityForCard(posts) {
        const entityIdForParams = this.getEntityIdForParams(posts);
        const orgIds = entityIdForParams[OrganizationsModelProvider.getEntityName()].ids;
        delete entityIdForParams[OrganizationsModelProvider.getEntityName()].ids;
        const usersIds = entityIdForParams[UsersModelProvider.getEntityName()].ids;
        delete entityIdForParams[OrganizationsModelProvider.getEntityName()].ids;
        const postIdToEntityCard = {};
        if (usersIds.length > 0) {
            const users = await UsersFetchService.findManyAndProcessForCard(usersIds);
            for (const postId in entityIdForParams[UsersModelProvider.getEntityName()]) {
                if (!entityIdForParams[UsersModelProvider.getEntityName()].hasOwnProperty(postId)) {
                    continue;
                }
                const userId = entityIdForParams[UsersModelProvider.getEntityName()][postId];
                postIdToEntityCard[postId] = users[userId];
            }
        }
        if (orgIds.length > 0) {
            const orgs = await OrganizationsFetchService.findManyAndProcessForCard(orgIds);
            for (const postId in entityIdForParams[OrganizationsModelProvider.getEntityName()]) {
                if (!entityIdForParams[OrganizationsModelProvider.getEntityName()].hasOwnProperty(postId)) {
                    continue;
                }
                const orgId = entityIdForParams[OrganizationsModelProvider.getEntityName()][postId];
                postIdToEntityCard[postId] = orgs[orgId];
            }
        }
        return postIdToEntityCard;
    }
    static getEntityIdForParams(posts) {
        const expectedEntityNameFor = [
            OrganizationsModelProvider.getEntityName(),
            UsersModelProvider.getEntityName(),
        ];
        const res = {
            [OrganizationsModelProvider.getEntityName()]: {
                ids: [],
            },
            [UsersModelProvider.getEntityName()]: {
                ids: [],
            },
        };
        posts.forEach((post) => {
            if (!post.entity_name_for || !(~expectedEntityNameFor.indexOf(post.entity_name_for))) {
                throw new errors_1.AppError(`Unsupported entity_name_for: ${post.entity_name_for}. Processed post body: ${JSON.stringify(post)}`, 500);
            }
            const entityNameFor = post.entity_name_for;
            res[entityNameFor][post.id] = +post.entity_id_for;
            // @ts-ignore
            res[entityNameFor].ids.push(+post.entity_id_for);
        });
        res[OrganizationsModelProvider.getEntityName()].ids =
            [...new Set(res[OrganizationsModelProvider.getEntityName()].ids)];
        res[UsersModelProvider.getEntityName()].ids =
            [...new Set(res[UsersModelProvider.getEntityName()].ids)];
        return res;
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
    static processForTrendingAndHotBackwardCompatibility(query) {
        if (query.sort_by === '-current_rate_delta_daily') {
            // @ts-ignore
            query.overview_type = EntityListCategoryDictionary.getTrending();
            // @ts-ignore
            query.sort_by = '-importance_delta';
        }
        if (query.created_at && query.created_at === '24_hours' && query.sort_by === '-current_rate') {
            // @ts-ignore
            query.overview_type = EntityListCategoryDictionary.getHot();
            // @ts-ignore
            query.sort_by = '-activity_index_delta';
        }
    }
}
module.exports = PostsFetchService;
