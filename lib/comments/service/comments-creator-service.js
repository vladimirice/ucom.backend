"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable max-len */
const ucom_libs_common_1 = require("ucom.libs.common");
const PostsRepository = require("../../posts/posts-repository");
const CommentsRepository = require("../comments-repository");
const PostStatsService = require("../../posts/stats/post-stats-service");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const CommentsModelProvider = require("./comments-model-provider");
const UserActivityService = require("../../users/user-activity-service");
const UsersTeamRepository = require("../../users/repository/users-team-repository");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const EntityImageInputService = require("../../entity-images/service/entity-image-input-service");
const CommentsInputProcessor = require("../validators/comments-input-processor");
const EosContentInputProcessor = require("../../eos/input-processor/content/eos-content-input-processor");
const _ = require('lodash');
const db = require('../../../models').sequelize;
class CommentsCreatorService {
    static async createNewCommentOnComment(body, postId, commentParentId, currentUser) {
        CommentsInputProcessor.process(body);
        const post = await PostsRepository.findOneOnlyWithOrganization(postId);
        const parentModel = await CommentsRepository.findOneById(commentParentId);
        const isCommentOnComment = true;
        return this.createNewComment(body, post, parentModel, isCommentOnComment, currentUser);
    }
    static async createNewCommentOnPost(body, postId, currentUser) {
        CommentsInputProcessor.process(body);
        const post = await PostsRepository.findOneOnlyWithOrganization(postId);
        const parentModel = null;
        const isCommentOnComment = false;
        return this.createNewComment(body, post, parentModel, isCommentOnComment, currentUser);
    }
    static async createNewComment(body, post, parentModel, isCommentOnComment, currentUser) {
        EosContentInputProcessor.validateContentSignedTransactionDetailsOrError(body);
        await this.processOrganizationAction(post, body, currentUser);
        // #task provide form validation
        const newModelData = _.pick(body, ['description', 'blockchain_id', 'organization_id']);
        newModelData.user_id = currentUser.id;
        newModelData.commentable_id = post.id;
        newModelData.parent_id = parentModel ? parentModel.id : null;
        EntityImageInputService.addEntityImageFieldFromBodyOrException(newModelData, body);
        const { newModel, newActivity } = await db
            .transaction(async (transaction) => {
            const newComment = await CommentsRepository.createNew(newModelData, transaction);
            const { path, depth } = await this.calcPathAndDepth(newComment.id, parentModel);
            await newComment.update({
                path,
                depth,
            }, { transaction });
            await PostStatsService.incrementCommentCount(post.id, transaction);
            const eventId = this.getEventId(isCommentOnComment ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName(), newComment, isCommentOnComment ? parentModel : post);
            const activity = await this.processBlockchainCommentCreation(newComment.id, body.signed_transaction, transaction, !!body.organization_id, isCommentOnComment ? newComment.parent_id : newComment.commentable_id, isCommentOnComment ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName(), eventId, currentUser);
            // noinspection JSUnusedGlobalSymbols
            return {
                newModel: newComment,
                newActivity: activity,
            };
        });
        await UserActivityService.sendContentCreationPayloadToRabbitWithEosVersion(newActivity, body.signed_transaction);
        return newModel;
    }
    /**
     *
     * @param {string} entityName
     * @param {Object} newModel
     * @param {Object} commentableModel
     * @return {*}
     * @private
     */
    static getEventId(entityName, newModel, commentableModel) {
        if (newModel.user_id === commentableModel.user_id) {
            return null; // #task - always fill event_id but it it possible that notification processor depends on this value
        }
        if (PostsModelProvider.isPost(entityName)) {
            if (commentableModel.organization) {
                return ucom_libs_common_1.EventsIdsDictionary.getUserCommentsOrgPost();
            }
            return ucom_libs_common_1.EventsIdsDictionary.getUserCommentsPost();
        }
        if (CommentsModelProvider.isComment(entityName)) {
            if (commentableModel.organization) {
                return ucom_libs_common_1.EventsIdsDictionary.getUserCommentsOrgComment();
            }
            return ucom_libs_common_1.EventsIdsDictionary.getUserCommentsComment();
        }
        return null;
    }
    static async processBlockchainCommentCreation(newCommentId, signedTransaction, transaction, isOrganization, commentableId, commentableName, eventId, currentUser) {
        return UserActivityService.processCommentCreation(currentUser.id, newCommentId, signedTransaction, isOrganization, commentableId, commentableName, eventId, transaction);
    }
    static async processOrganizationAction(post, body, currentUser) {
        if (!post.organization) {
            body.organization_id = null;
            return;
        }
        if (post.organization.user_id === currentUser.id) {
            body.organization_id = post.organization.id;
            return;
        }
        const isTeamMember = await UsersTeamRepository.isTeamMember(OrganizationsModelProvider.getEntityName(), post.organization.id, currentUser.id);
        if (!isTeamMember) {
            body.organization_id = null;
            return;
        }
        body.organization_id = post.organization.id;
    }
    /**
     *
     * @param {number} id
     * @param {Object|null} parentComment
     * @returns {Promise<Object>}
     */
    static async calcPathAndDepth(id, parentComment) {
        if (!parentComment) {
            return {
                path: [id],
                depth: 0,
            };
        }
        const parentPath = JSON.parse(parentComment.path);
        const parentDepth = parentComment.depth;
        parentPath.push(id);
        return {
            path: parentPath,
            depth: parentDepth + 1,
        };
    }
}
exports.CommentsCreatorService = CommentsCreatorService;
