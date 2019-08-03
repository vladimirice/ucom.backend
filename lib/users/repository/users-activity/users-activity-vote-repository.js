"use strict";
const UsersModelProvider = require("../../users-model-provider");
const PostsModelProvider = require("../../../posts/service/posts-model-provider");
const knex = require("../../../../config/knex");
const CommentsModelProvider = require("../../../comments/service/comments-model-provider");
const TABLE_NAME = UsersModelProvider.getUsersActivityVoteTableName();
class UsersActivityVoteRepository {
    static async insertOnePostVote(userId, postId, interactionType, transaction) {
        await transaction(TABLE_NAME).insert({
            user_id: userId,
            entity_id: postId,
            entity_name: PostsModelProvider.getEntityName(),
            interaction_type: interactionType,
        });
    }
    static async insertOneCommentVote(userId, postId, interactionType, transaction) {
        await transaction(TABLE_NAME).insert({
            user_id: userId,
            entity_id: postId,
            entity_name: CommentsModelProvider.getEntityName(),
            interaction_type: interactionType,
        });
    }
    static async doesUserVotePost(userId, postId) {
        const data = await this.getUserVotesPost(userId, postId);
        return data !== null;
    }
    static async doesUserVoteComment(userId, commentId) {
        const data = await this.getUserVotesComment(userId, commentId);
        return data !== null;
    }
    static async getUserVotesPost(userId, postId) {
        const res = await knex(TABLE_NAME)
            .where({
            user_id: userId,
            entity_id: postId,
            entity_name: PostsModelProvider.getEntityName(),
        })
            .first();
        return res || null;
    }
    static async getUserVotesComment(userId, commentId) {
        const res = await knex(TABLE_NAME)
            .where({
            user_id: userId,
            entity_id: commentId,
            entity_name: CommentsModelProvider.getEntityName(),
        })
            .first();
        return res || null;
    }
}
module.exports = UsersActivityVoteRepository;
