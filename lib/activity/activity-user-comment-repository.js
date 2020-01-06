"use strict";
const UsersModelProvider = require("../users/users-model-provider");
const models = require('../../models');
const activityTypesDictionary = require('../activity/activity-types-dictionary');
const TABLE_NAME = UsersModelProvider.getActivityUserCommentTableName();
class ActivityUserCommentRepository {
    static async createNewActivity(currentUser, comment, interactionType, transaction) {
        await transaction(TABLE_NAME).insert({
            user_id_from: currentUser.id,
            comment_id_to: comment.id,
            activity_type_id: interactionType,
        });
    }
    static async getUserCommentUpvote(userIdFrom, commentIdTo) {
        const activityTypeId = activityTypesDictionary.getUpvoteId();
        return this.getModel()
            .findOne({
            where: {
                user_id_from: userIdFrom,
                comment_id_to: commentIdTo,
                activity_type_id: activityTypeId,
            },
            raw: true,
        });
    }
    static async getUserCommentDownvote(userIdFrom, commentIdTo) {
        const activityTypeId = activityTypesDictionary.getDownvoteId();
        return this.getModel()
            .findOne({
            where: {
                user_id_from: userIdFrom,
                comment_id_to: commentIdTo,
                activity_type_id: activityTypeId,
            },
            raw: true,
        });
    }
    static getModel() {
        // eslint-disable-next-line security/detect-object-injection
        return models[TABLE_NAME];
    }
}
module.exports = ActivityUserCommentRepository;
