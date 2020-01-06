"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const PostsFetchService = require("./service/posts-fetch-service");
const PostCreatorService = require("./service/post-creator-service");
const UserActivityService = require("../users/user-activity-service");
const PostsRepository = require("./posts-repository");
const EntityImageInputService = require("../entity-images/service/entity-image-input-service");
const PostToEventIdService = require("./service/post-to-event-id-service");
const UsersModelProvider = require("../users/users-model-provider");
const UsersRepository = require("../users/users-repository");
const OrganizationsModelProvider = require("../organizations/service/organizations-model-provider");
const OrganizationsRepository = require("../organizations/repository/organizations-repository");
const PostStatsRepository = require("./stats/post-stats-repository");
const PostOfferRepository = require("./repository/post-offer-repository");
const _ = require('lodash');
const models = require('../../models');
const { BadRequestError } = require('../../lib/api/errors');
/**
 * Post Creation functions should be placed in PostCreatorService
 */
class PostService {
    /**
     *
     * @param {number} postId
     * @param {boolean} raw
     * @returns {Promise<Object>}
     */
    static async findPostStatsById(postId, raw = true) {
        return PostStatsRepository.findOneByPostId(postId, raw);
    }
    /**
     *
     * @param {number} postId
     * @param {Array} params
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    static async updatePostUsersTeam(postId, params, transaction) {
        // eslint-disable-next-line you-dont-need-lodash-underscore/filter
        params.post_users_team = _.filter(params.post_users_team);
        if (!params.post_users_team || _.isEmpty(params.post_users_team)) {
            return;
        }
        // noinspection TypeScriptValidateJSTypes
        const sourceModel = await models.post_users_team.findAll({
            where: {
                post_id: postId,
            },
            raw: true,
        });
        const deltas = this.getDelta(sourceModel, params.post_users_team);
        await this.updateRelations(postId, deltas, 'post_users_team', transaction);
    }
    static async updateAuthorPost(postId, userId, body, currentUser) {
        const currentUserId = currentUser.id;
        // #task #refactor - use pick and wrap into transaction
        delete body.id;
        delete body.user_id;
        delete body.current_rate;
        delete body.current_vote;
        const signedTransaction = body.signed_transaction || '';
        // #task #optimization
        const postToUpdate = await models.posts.findOne({
            where: {
                id: postId,
            },
        });
        PostService.checkPostUpdatingConditions(postToUpdate, currentUserId);
        if (postToUpdate.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeMediaPost()) {
            // noinspection AssignmentToFunctionParameterJS
            // noinspection JSValidateTypes
            body = _.pick(body, ['post_type_id', 'title', 'description', 'leading_text', 'entity_images', 'signed_transaction']);
        }
        const { updatedPost, newActivity } = await models.sequelize.transaction(async (transaction) => {
            if (postToUpdate.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeOffer() && body.post_users_team) {
                await PostService.updatePostUsersTeam(postId, body, transaction);
            }
            // #refactor
            const updatePostParams = _.cloneDeep(body);
            delete updatePostParams.entity_images;
            EntityImageInputService.addEntityImageFieldFromBodyOrException(updatePostParams, body);
            await models.posts.update(updatePostParams, {
                transaction,
                where: {
                    id: postId,
                    user_id: userId,
                },
                returning: true,
                raw: true,
            });
            const updated = await PostsRepository.findOnlyPostItselfById(postId, transaction);
            if (updated.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeOffer()) {
                await models.post_offer.update(body, {
                    transaction,
                    where: {
                        post_id: postId,
                    },
                });
            }
            const eventId = PostToEventIdService.getUpdatingEventIdByPost(updated);
            const activity = await UserActivityService.processPostIsUpdated(updated, currentUserId, eventId, transaction, signedTransaction);
            return {
                updatedPost: updated,
                newActivity: activity,
            };
        });
        await UserActivityService.sendContentUpdatingPayloadToRabbitWithSuppressEmpty(newActivity);
        if (PostService.isDirectPost(updatedPost)) {
            return PostsFetchService.findOnePostByIdAndProcess(updatedPost.id, currentUser.id);
        }
        return updatedPost;
    }
    /**
     *
     * @param {Object} post
     * @return {boolean}
     */
    static isDirectPost(post) {
        return post.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost();
    }
    static async processNewDirectPostCreationForUser(req, currentUser) {
        const userIdTo = req.user_id;
        delete req.user_id;
        if (+req.body.post_type_id !== ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost()) {
            throw new BadRequestError({
                general: `Direct post is allowed only for post type ID ${ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost()}`,
            });
        }
        req.body.entity_id_for = userIdTo;
        req.body.entity_name_for = UsersModelProvider.getEntityName();
        const eventId = ucom_libs_common_1.EventsIdsDictionary.userCreatesDirectPostForOtherUser();
        const accountNameTo = await UsersRepository.findAccountNameById(userIdTo);
        if (!accountNameTo) {
            throw new Error(`There is no account name for userIdTo: ${userIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
        }
        return PostCreatorService.processNewPostCreation(req, eventId, currentUser);
    }
    static async processNewDirectPostCreationForOrg(req, currentUser) {
        const orgIdTo = req.organization_id;
        delete req.organization_id;
        if (+req.body.post_type_id !== ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost()) {
            throw new BadRequestError({
                general: `Direct post is allowed only for post type ID ${ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost()}`,
            });
        }
        req.body.entity_id_for = orgIdTo;
        req.body.entity_name_for = OrganizationsModelProvider.getEntityName();
        const eventId = ucom_libs_common_1.EventsIdsDictionary.getUserCreatesDirectPostForOrg();
        const orgBlockchainId = await OrganizationsRepository.findBlockchainIdById(orgIdTo);
        if (!orgBlockchainId) {
            throw new Error(`There is no blockchain ID for orgIdTo: ${orgIdTo}. Body is: ${JSON.stringify(req.body, null, 2)}`);
        }
        return PostCreatorService.processNewPostCreation(req, eventId, currentUser);
    }
    static async findOnePostByIdAndProcess(postId, currentUser) {
        return PostsFetchService.findOnePostByIdAndProcess(postId, currentUser.id);
    }
    static async findLastPostOfferByAuthor(userId) {
        return PostOfferRepository.findLastByAuthor(userId);
    }
    static async findLastMediaPostByAuthor(userId) {
        return PostsRepository.findLastByAuthor(userId);
    }
    static async findLastPostOffer() {
        return PostOfferRepository.findLast();
    }
    // @ts-ignore
    static async addOrganizationPreviewData(model) {
        if (!model.organization_id) {
            return;
        }
        // #task Fetch all at once by JOIN
        model.organization = await OrganizationsRepository.findOneByIdForPreview(model.organization_id);
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
        const added = updated.filter((updatedItem) => source.find((sourceItem) => sourceItem.id === updatedItem.id) === undefined);
        const deleted = source.filter((sourceItem) => updated.find((updatedItem) => updatedItem.id === sourceItem.id) === undefined);
        return {
            added,
            deleted,
        };
    }
    static checkPostUpdatingConditions(postToUpdate, currentUserId) {
        const unableToEdit = [
            ucom_libs_common_1.ContentTypesDictionary.getTypeRepost(),
        ];
        if (~unableToEdit.indexOf(postToUpdate.post_type_id)) {
            throw new BadRequestError({
                post_type_id: `It is not allowed to update post with type ${postToUpdate.post_type_id}`,
            });
        }
        if (postToUpdate.user_id !== currentUserId) {
            throw new BadRequestError('Only post author can update the post');
        }
    }
}
module.exports = PostService;
