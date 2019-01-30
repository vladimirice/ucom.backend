"use strict";
const PostsFetchService = require("./service/posts-fetch-service");
const status = require('statuses');
const _ = require('lodash');
const { TransactionFactory, ContentTypeDictionary } = require('ucom-libs-social-transactions');
const postsRepository = require('./posts-repository');
const postStatsRepository = require('./stats/post-stats-repository');
const postsOffersRepository = require('./repository').PostOffer;
const models = require('../../models');
const db = models.sequelize;
const { AppError, BadRequestError } = require('../../lib/api/errors');
const postSanitizer = require('./post-sanitizer');
const usersRepositories = require('../users/repository');
const organizationsModelProvider = require('../organizations/service/organizations-model-provider');
const eosBlockchainUniqid = require('../eos/eos-blockchain-uniqid');
const usersActivityService = require('../users/user-activity-service');
const postRepositories = require('./repository');
const organizationRepositories = require('../organizations/repository');
const usersModelProvider = require('../users/service').ModelProvider;
const eventIdDictionary = require('../entities/dictionary').EventId;
const eosTransactionService = require('../eos/eos-transaction-service');
const postCreatorService = require('./service/post-creator-service');
const postActivityService = require('./post-activity-service');
const postsFetchService = require('./service/posts-fetch-service');
/**
 * Post Creation functions should be placed in PostCreatorService
 */
class PostService {
    constructor(currentUser) {
        this.currentUser = currentUser;
    }
    /**
     *
     * @param {number} modelIdTo
     * @param {Object} body
     * @returns {Promise<{current_vote: number}>}
     */
    async userUpvotesPost(modelIdTo, body) {
        const userFrom = this.currentUser.user;
        return postActivityService.userUpvotesPost(userFrom, modelIdTo, body);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {number} modelIdTo
     * @param {Object} body
     * @returns {Promise<{current_vote: number}>}
     */
    async userDownvotesPost(modelIdTo, body) {
        const userFrom = this.currentUser.user;
        return postActivityService.userDownvotesPost(userFrom, modelIdTo, body);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {number} postId
     * @param {boolean} raw
     * @returns {Promise<Object>}
     */
    static async findPostStatsById(postId, raw = true) {
        return postStatsRepository.findOneByPostId(postId, raw);
    }
    /**
     *
     * @param {number} postId
     * @param {Array} params
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    static async updatePostUsersTeam(postId, params, transaction) {
        params.post_users_team = _.filter(params.post_users_team);
        if (!params.post_users_team || _.isEmpty(params.post_users_team)) {
            return;
        }
        const sourceModel = await models.post_users_team.findAll({
            where: {
                post_id: postId,
            },
            raw: true,
        });
        const deltas = this.getDelta(sourceModel, params.post_users_team);
        await this.updateRelations(postId, deltas, 'post_users_team', transaction);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {number} postId
     * @param {number} userId
     * @param {Array} params
     * @returns {Promise<Object>}
     */
    async updateAuthorPost(postId, userId, params) {
        const currentUserId = this.currentUser.id;
        // #task #refactor - use pick and wrap into transaction
        delete params.id;
        delete params.user_id;
        delete params.current_rate;
        delete params.current_vote;
        // noinspection JSDeprecatedSymbols
        postSanitizer.sanitisePost(params);
        postCreatorService.processEntityImagesWhileUpdating(params);
        // #task #optimization
        const postToUpdate = await models.posts.findOne({
            where: {
                id: postId,
            },
        });
        this.checkPostUpdatingConditions(postToUpdate);
        if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeMediaPost()) {
            // noinspection AssignmentToFunctionParameterJS
            // noinspection JSValidateTypes
            params = _.pick(params, ['post_type_id', 'title', 'description', 'main_image_filename', 'leading_text', 'entity_images']);
        }
        const { updatedPost, newActivity } = await db
            .transaction(async (transaction) => {
            if (postToUpdate.post_type_id === ContentTypeDictionary.getTypeOffer() && params.post_users_team) {
                await PostService.updatePostUsersTeam(postId, params, transaction);
            }
            const [updatedCount, updatedPosts] = await models.posts.update(params, {
                transaction,
                where: {
                    id: postId,
                    user_id: userId,
                },
                returning: true,
                raw: true,
            });
            if (updatedCount === 0) {
                throw new AppError(`There is no post with ID ${postId} and author ID ${userId}`, status('not found'));
            }
            const updatedPost = updatedPosts[0];
            if (updatedPost.post_type_id === ContentTypeDictionary.getTypeOffer()) {
                await models.post_offer.update(params, {
                    transaction,
                    where: {
                        post_id: postId,
                    },
                });
            }
            const newActivity = await usersActivityService.processPostIsUpdated(updatedPost, currentUserId, transaction);
            return {
                updatedPost,
                newActivity,
            };
        });
        await usersActivityService.sendContentUpdatingPayloadToRabbit(newActivity);
        if (PostService.isDirectPost(updatedPost)) {
            return this.findOnePostByIdAndProcess(updatedPost.id);
        }
        return updatedPost;
    }
    /**
     *
     * @param {Object} post
     * @return {boolean}
     */
    static isDirectPost(post) {
        return post.post_type_id === ContentTypeDictionary.getTypeDirectPost();
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Object} givenBody
     * @param {number} postId
     * @return {Promise<Object>}
     */
    async processRepostCreation(givenBody, postId) {
        const { user } = this.currentUser;
        return postCreatorService.processRepostCreation(givenBody, postId, user);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Object} req
     * @return {Promise<Object>}
     */
    async processNewDirectPostCreationForUser(req) {
        const userIdTo = req.user_id;
        delete req.user_id;
        if (+req.body.post_type_id !== ContentTypeDictionary.getTypeDirectPost()) {
            throw new BadRequestError({
                general: `Direct post is allowed only for post type ID ${ContentTypeDictionary.getTypeDirectPost()}`,
            });
        }
        // noinspection JSUnusedGlobalSymbols
        req.body.entity_id_for = userIdTo;
        req.body.entity_name_for = usersModelProvider.getEntityName();
        const eventId = eventIdDictionary.getUserCreatesDirectPostForOtherUser();
        const accountNameTo = await usersRepositories.Main.findAccountNameById(userIdTo);
        if (!accountNameTo) {
            throw new Error(`There is no account name for userIdTo: ${userIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
        }
        await eosTransactionService.appendSignedUserCreatesDirectPostForOtherUser(req.body, this.currentUser.user, accountNameTo);
        return this.processNewPostCreation(req, eventId);
    }
    /**
     *
     * @param {Object} req
     * @return {Promise<Object>}
     */
    async processNewDirectPostCreationForOrg(req) {
        const orgIdTo = req.organization_id;
        delete req.organization_id;
        if (+req.body.post_type_id !== ContentTypeDictionary.getTypeDirectPost()) {
            throw new BadRequestError({
                general: `Direct post is allowed only for post type ID ${ContentTypeDictionary.getTypeDirectPost()}`,
            });
        }
        req.body.entity_id_for = orgIdTo;
        req.body.entity_name_for = organizationsModelProvider.getEntityName();
        const eventId = eventIdDictionary.getUserCreatesDirectPostForOrg();
        const orgBlockchainId = await organizationRepositories.Main.findBlockchainIdById(orgIdTo);
        if (!orgBlockchainId) {
            throw new Error(`There is no blockchain ID for orgIdTo: ${orgIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
        }
        await eosTransactionService.appendSignedUserCreatesDirectPostForOrg(req.body, this.currentUser.user, orgBlockchainId);
        return this.processNewPostCreation(req, eventId);
    }
    /**
     *
     * @param {Object} req
     * @param {number|null} eventId
     * @return {Promise<Object>}
     */
    async processNewPostCreation(req, eventId = null) {
        // #task - wrap in database transaction
        const { files } = req;
        const { body } = req;
        // #task - provide Joi validation
        if (body && body.title && body.title.length > 255) {
            throw new BadRequestError({ title: 'Title is too long. Size must be up to 255 symbols.' });
        }
        // #task - provide Joi validation
        if (body && body.leading_text && body.leading_text.length > 255) {
            throw new BadRequestError({ leading_text: 'Leading_text is too long. Size must be up to 255 symbols.' });
        }
        const postTypeId = +req.body.post_type_id;
        if (!postTypeId) {
            throw new BadRequestError({
                post_type_id: 'Post Type ID must be a valid natural number',
            });
        }
        let orgBlockchainId = null;
        if (!body.organization_id) {
            body.organization_id = null;
        }
        else {
            orgBlockchainId = await organizationRepositories.Main.findBlockchainIdById(+body.organization_id);
            if (!orgBlockchainId) {
                throw new BadRequestError({ general: `There is no orgBlockchainId for org with ID ${+body.organization_id}` }, 404);
            }
        }
        await PostService.addSignedTransactionDetailsToBody(body, this.currentUser.user, postTypeId, orgBlockchainId);
        await this.makeOrganizationRelatedChecks(body, this.currentUser.user);
        await this.addAttributesOfEntityFor(body, this.currentUser.user);
        // noinspection JSDeprecatedSymbols
        postSanitizer.sanitisePost(body);
        // noinspection OverlyComplexBooleanExpressionJS
        if (files && files.main_image_filename && files.main_image_filename[0] && files.main_image_filename[0].filename) {
            body.main_image_filename = files.main_image_filename[0].filename;
        }
        postCreatorService.processEntityImagesWhileCreation(body);
        const { newPost, newActivity } = await models.sequelize
            .transaction(async (transaction) => {
            const newPost = await this.createPostByPostType(postTypeId, body, transaction);
            const newActivity = await this.createNewActivity(newPost, body.signed_transaction, this.currentUser.getId(), eventId, transaction);
            // noinspection JSUnusedGlobalSymbols
            return {
                newPost,
                newActivity,
            };
        });
        await usersActivityService.sendContentCreationPayloadToRabbit(newActivity);
        if (PostService.isDirectPost(newPost)) {
            // Direct Post creation = full post content, not only ID
            return this.findOnePostByIdAndProcess(newPost.id);
        }
        return newPost;
    }
    /**
     *
     * @param {Object} newPost
     * @param {string} signedTransaction
     * @param {number} currentUserId
     * @param {number|null} eventId
     * @param {Object} transaction
     * @return {Promise<Object>}
     * @private
     */
    async createNewActivity(newPost, signedTransaction, currentUserId, eventId = null, transaction = null) {
        let newActivity;
        if (newPost.organization_id) {
            newActivity = await usersActivityService.processOrganizationCreatesPost(newPost, eventId, signedTransaction, currentUserId, transaction);
        }
        else {
            newActivity = await usersActivityService.processUserHimselfCreatesPost(newPost, eventId, signedTransaction, currentUserId, transaction);
        }
        return newActivity;
    }
    /**
     *
     * @param {number} postTypeId
     * @param {Object} body
     * @param {Object} transaction
     * @return {Promise<Object>}
     * @private
     */
    async createPostByPostType(postTypeId, body, transaction) {
        const currentUserId = this.currentUser.getCurrentUserId();
        // #task - provide body validation form via Joi
        let newPost;
        switch (postTypeId) {
            case ContentTypeDictionary.getTypeMediaPost():
                newPost = await postsRepository.createNewPost(body, currentUserId, transaction);
                break;
            case ContentTypeDictionary.getTypeOffer():
                newPost = await postRepositories.PostOffer.createNewOffer(body, currentUserId, transaction);
                break;
            case ContentTypeDictionary.getTypeDirectPost():
                newPost = await postsRepository.createNewPost(body, currentUserId, transaction);
                break;
            case ContentTypeDictionary.getTypeRepost():
                newPost = await postsRepository.createNewPost(body, currentUserId, transaction);
                break;
            default:
                throw new BadRequestError({
                    post_type_id: `Provided post type ID is not supported: ${postTypeId}`,
                });
        }
        return newPost;
    }
    /**
     *
     * @param {Object} body
     * @param {Object} user
     * @param {number} postTypeId
     * @param {string|null} organizationBlockchainId
     * @return {Promise<void>}
     * @private
     */
    static async addSignedTransactionDetailsToBody(body, user, postTypeId, organizationBlockchainId = null) {
        if (postTypeId === ContentTypeDictionary.getTypeDirectPost()) {
            return;
        }
        // noinspection IfStatementWithTooManyBranchesJS
        if (postTypeId === ContentTypeDictionary.getTypeMediaPost()) {
            body.blockchain_id = eosBlockchainUniqid.getUniqidForMediaPost();
        }
        else if (postTypeId === ContentTypeDictionary.getTypeOffer()) {
            body.blockchain_id = eosBlockchainUniqid.getUniqidForPostOffer();
        }
        else {
            throw new BadRequestError({ post_type_id: `Unsupported post type id: ${postTypeId}` });
        }
        if (organizationBlockchainId) {
            // noinspection JSAccessibilityCheck
            body.signed_transaction = await TransactionFactory._getSignedOrganizationCreatesContent(user.account_name, user.private_key, organizationBlockchainId, body.blockchain_id, postTypeId);
        }
        else {
            // noinspection JSAccessibilityCheck
            body.signed_transaction = await TransactionFactory._userHimselfCreatesPost(user.account_name, user.private_key, body.blockchain_id, postTypeId);
        }
    }
    async findOnePostByIdAndProcess(postId) {
        const userId = this.currentUser.id;
        return PostsFetchService.findOnePostByIdAndProcess(postId, userId);
    }
    /**
     *
     * @return {Promise<Object>}
     */
    async findAndProcessAllForMyselfNewsFeed(query) {
        const currentUserId = this.currentUser.id;
        return postsFetchService.findAndProcessAllForMyselfNewsFeed(query, currentUserId);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {number} userId
     * @param {Object} query
     * @return {Promise<Object>}
     */
    async findAndProcessAllForUserWallFeed(userId, query = null) {
        const currentUserId = this.currentUser.id;
        return postsFetchService.findAndProcessAllForUserWallFeed(userId, currentUserId, query);
    }
    /**
     *
     * @param {number} orgId
     * @param {Object} query
     * @return {Promise<{data, metadata}>}
     */
    async findAndProcessAllForOrgWallFeed(orgId, query) {
        const userId = this.currentUser.id;
        return postsFetchService.findAndProcessAllForOrgWallFeed(orgId, userId, query);
    }
    static async findLastPostOfferByAuthor(userId) {
        return postsOffersRepository.findLastByAuthor(userId);
    }
    static async findLastMediaPostByAuthor(userId) {
        return postsRepository.findLastByAuthor(userId);
    }
    static async findLastPostOffer() {
        return postsOffersRepository.findLast();
    }
    // @ts-ignore
    static async addOrganizationPreviewData(model) {
        if (!model.organization_id) {
            return;
        }
        // #task Fetch all at once by JOIN
        model.organization = await organizationRepositories.Main.findOneByIdForPreview(model.organization_id);
    }
    /**
     *
     * @param {number} postId
     * @param {Object} deltaData
     * @param {string} modelName
     * @param {Object} transaction
     * @return {Promise<boolean>}
     */
    static async updateRelations(postId, deltaData, modelName, transaction) {
        const promises = [];
        deltaData.deleted.forEach((data) => {
            const promise = models[modelName].destroy({
                transaction,
                where: {
                    id: data.id,
                },
            });
            promises.push(promise);
        });
        deltaData.added.forEach((data) => {
            // #task do this beforehand
            data.post_id = postId;
            data.user_id = data.id;
            delete data.id;
            const promise = models[modelName].create(data, { transaction });
            promises.push(promise);
        });
        return Promise.all(promises);
    }
    static getDelta(source, updated) {
        const added = updated.filter(updatedItem => source.find(sourceItem => sourceItem.id === updatedItem.id) === undefined);
        const deleted = source.filter(sourceItem => updated.find(updatedItem => updatedItem.id === sourceItem.id) === undefined);
        return {
            added,
            deleted,
        };
    }
    /**
     *
     * @param {Object} body
     * @param {Object} user
     * @return {Promise<void>}
     * @private
     */
    async makeOrganizationRelatedChecks(body, user) {
        if (!body.organization_id) {
            return;
        }
        const doesExist = await organizationRepositories.Main.doesExistById(body.organization_id);
        if (!doesExist) {
            throw new AppError(`There is no organization with ID ${body.organization_id}.`, 404);
        }
        await this.checkCreationBehalfPermissions(user.id, body.organization_id);
    }
    /**
     *
     * @param {Object} body
     * @param {Object} user
     * @return {Promise<void>}
     * @private
     */
    async addAttributesOfEntityFor(body, user) {
        if (+body.post_type_id === ContentTypeDictionary.getTypeDirectPost()) {
            // direct post entity_id_for is set beforehand. Refactor this in future
            return;
        }
        // Repost is created only for user, not for organization
        if (!body.organization_id) {
            body.entity_id_for = user.id;
            body.entity_name_for = usersModelProvider.getEntityName();
            return;
        }
        body.entity_id_for = body.organization_id;
        body.entity_name_for = organizationsModelProvider.getEntityName();
    }
    /**
     *
     * @param {number} userId
     * @param {number|null} organizationId
     * @return {Promise<void>}
     * @private
     */
    async checkCreationBehalfPermissions(userId, organizationId = null) {
        if (organizationId === null) {
            return;
        }
        // Check if user is an author of the organization
        const isOrgAuthor = await organizationRepositories.Main.isUserAuthor(organizationId, userId);
        const isTeamMember = await usersRepositories.UsersTeam.isTeamMember(organizationsModelProvider.getEntityName(), organizationId, userId);
        if (!isOrgAuthor && !isTeamMember) {
            throw new AppError('It is not permitted to create post on behalf of this organization', 403);
        }
    }
    /**
     *
     * @param {Object} postToUpdate
     * @private
     */
    checkPostUpdatingConditions(postToUpdate) {
        const unableToEdit = [
            ContentTypeDictionary.getTypeRepost(),
        ];
        if (~unableToEdit.indexOf(postToUpdate.post_type_id)) {
            throw new BadRequestError({
                post_type_id: `It is not allowed to update post with type ${postToUpdate.post_type_id}`,
            });
        }
    }
}
module.exports = PostService;
