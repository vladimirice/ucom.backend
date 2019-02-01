"use strict";
const _ = require('lodash');
const db = require('../../../models').sequelize;
const { BadRequestError } = require('../../../lib/api/errors');
const config = require('config');
const backendConfig = config.host;
const httpImagesFolder = `${backendConfig.root_url}${backendConfig.profile_files_upload_dir}`;
const eosTransactionService = require('../../eos/eos-transaction-service');
const usersActivityService = require('../../users/user-activity-service');
const usersModelProvider = require('../../users/service').ModelProvider;
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const eventIdDictionary = require('../../entities/dictionary').EventId;
const usersActivityRepository = require('../../users/repository/users-activity-repository');
const postsRepository = require('../posts-repository');
/**
 * beginning of refactoring
 */
class PostCreatorService {
    /**
     * In future - make private
     *
     * @param {Object} body
     */
    static processEntityImagesWhileCreation(body) {
        if (body.main_image_filename && body.entity_images) {
            throw new BadRequestError('It is not possible to create post using both main_image_filename and entity_images');
        }
        // legacy compatibility
        if (body.main_image_filename) {
            body.entity_images = {
                article_title: [
                    {
                        url: `${httpImagesFolder}/${body.main_image_filename}`,
                    },
                ],
            };
        }
        if (!body.entity_images) {
            body.entity_images = null;
            return;
        }
        if (typeof body.entity_images === 'string') {
            body.entity_images = JSON.parse(body.entity_images);
        }
        this.checkPostEntityImages(body);
    }
    /**
     * In future - make private
     *
     * @param {Object} model
     */
    static processEntityImagesWhileUpdating(model) {
        // legacy compatibility. Main image filename rewrites entity_images if set
        if (model.main_image_filename) {
            model.entity_images = {
                article_title: [
                    {
                        url: `${httpImagesFolder}/${model.main_image_filename}`,
                    },
                ],
            };
        }
        if (!model.entity_images) {
            return;
        }
        if (typeof model.entity_images === 'string') {
            model.entity_images = JSON.parse(model.entity_images);
        }
        this.checkPostEntityImages(model);
    }
    /**
     *
     * @param {Object} model
     */
    static checkPostEntityImages(model) {
        if (!model.entity_images) {
            throw new BadRequestError('Model must contain entity_images field');
        }
        if (!model.entity_images.article_title || !Array.isArray(model.entity_images.article_title)) {
            throw new BadRequestError('Entity images must contain article_title array of objects');
        }
        if (model.entity_images.article_title.length !== 1) {
            throw new BadRequestError('Entity images must contain exactly one object');
        }
        for (let i = 0; i < model.entity_images.article_title.length; i += 1) {
            const current = model.entity_images.article_title[i];
            if (!current.url || current.url.length === 0) {
                throw new BadRequestError('Entity images object must contain valid url field');
            }
        }
    }
    /**
     *
     * @param {Object} givenBody
     * @param {number} postId
     * @param {Object} user
     * @return {Promise<{id: *}>}
     */
    static async processRepostCreation(givenBody, postId, user) {
        const parentPost = await this.checkParentPostOfRepost(postId, user.id);
        const body = _.pick(givenBody, ['signed_transaction', 'blockchain_id']);
        body.post_type_id = ContentTypeDictionary.getTypeRepost();
        body.parent_id = postId;
        body.entity_id_for = user.id;
        body.entity_name_for = usersModelProvider.getEntityName();
        await eosTransactionService.appendSignedUserCreatesRepost(body, user, parentPost.blockchain_id);
        const eventId = eventIdDictionary.getRepostEventId(parentPost.organization_id);
        const { newPost, newActivity } = await db
            .transaction(async (transaction) => {
            const newPost = await postsRepository.createNewPost(body, user.id, transaction);
            const newActivity = await PostCreatorService.createNewActivityForRepost(newPost, body.signed_transaction, user.id, eventId, transaction);
            // noinspection JSUnusedGlobalSymbols
            return {
                newPost,
                newActivity,
            };
        });
        await usersActivityService.sendContentCreationPayloadToRabbit(newActivity);
        return {
            id: newPost.id,
        };
    }
    /**
     *
     * @param {number} postId
     * @param {number} userId
     * @return {Promise<Object>}
     */
    static async checkParentPostOfRepost(postId, userId) {
        const post = await postsRepository.findOneOnlyWithOrganization(postId);
        if (post.post_type_id === ContentTypeDictionary.getTypeRepost()) {
            throw new BadRequestError({
                general: 'It is not possible to create repost on repost',
            });
        }
        if (post.post_type_id === ContentTypeDictionary.getTypeDirectPost()
            && post.entity_id_for === userId
            && post.entity_name_for === usersModelProvider.getEntityName()) {
            throw new BadRequestError({
                general: 'It is not possible to create repost on direct post of yours',
            });
        }
        if (post.user_id === userId) {
            throw new BadRequestError({
                general: 'It is not possible to create repost on your own post',
            });
        }
        const isRepost = await usersActivityRepository.doesUserHaveRepost(userId, postId);
        if (isRepost) {
            throw new BadRequestError({
                general: 'It is not possible to repost the same post twice by one user',
            });
        }
        return post;
    }
    /**
     *
     * @param {Object} newPost
     * @param {string} signedTransaction
     * @param {number} currentUserId
     * @param {number} eventId
     * @param {Object} transaction
     * @return {Promise<Object>}
     * @private
     */
    static async createNewActivityForRepost(newPost, signedTransaction, currentUserId, eventId = null, transaction = null) {
        let newActivity;
        if (newPost.organization_id) {
            newActivity = await usersActivityService.processOrganizationCreatesRepost(newPost, eventId, signedTransaction, currentUserId, transaction);
        }
        else {
            newActivity = await usersActivityService.processUserHimselfCreatesRepost(newPost, eventId, signedTransaction, currentUserId, transaction);
        }
        return newActivity;
    }
}
module.exports = PostCreatorService;
