"use strict";
const errors_1 = require("../../api/errors");
const knex = require("../../../config/knex");
const UserActivityService = require("../../users/user-activity-service");
const CommentsRepository = require("../comments-repository");
const CommentToEventIdService = require("./comment-to-event-id-service");
const CommentsModelProvider = require("./comments-model-provider");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
class CommentsUpdateService {
    static async updateComment(commentId, body, currentUserId) {
        const signedTransaction = body.signed_transaction || '';
        // #task #optimization
        const commentToUpdate = await CommentsRepository.findOnlyCommentItselfById(commentId);
        if (commentToUpdate.user_id !== currentUserId) {
            throw new errors_1.HttpForbiddenError('Only author can update a comment');
        }
        const { description, entity_images } = body;
        if (!description || !entity_images) {
            throw new errors_1.BadRequestError('Please provide both description and entity_images in the body');
        }
        const commentableId = commentToUpdate.depth > 0 ? commentToUpdate.parent_id : commentToUpdate.commentable_id;
        const commentableName = commentToUpdate.depth > 0 ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName();
        const newActivity = await knex.transaction(async (transaction) => {
            await transaction(CommentsModelProvider.getTableName())
                .update({
                description,
                entity_images,
            })
                .where({
                id: commentId,
                user_id: currentUserId,
            });
            const eventId = CommentToEventIdService.getUpdatingEventIdByPost(commentToUpdate);
            return UserActivityService.processCommentIsUpdated(commentId, currentUserId, eventId, transaction, signedTransaction, commentableId, commentableName);
        });
        await UserActivityService.sendContentUpdatingPayloadToRabbitWithSuppressEmpty(newActivity);
    }
}
module.exports = CommentsUpdateService;
