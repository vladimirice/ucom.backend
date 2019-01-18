"use strict";
const models = require('../../models');
const activityTypesDictionary = require('../activity/activity-types-dictionary');
const TABLE_NAME = 'activity_user_comment';
class ActivityUserCommentRepository {
    static async createNewActivity(userIdFrom, commentIdTo, activityTypeId, transaction) {
        const data = {
            user_id_from: userIdFrom,
            comment_id_to: commentIdTo,
            activity_type_id: activityTypeId,
        };
        return await this.getModel().create(data, {
            transaction,
        });
    }
    static async getUserCommentUpvote(userIdFrom, commentIdTo) {
        const activityTypeId = activityTypesDictionary.getUpvoteId();
        return await this.getModel()
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
        return await this.getModel()
            .findOne({
            where: {
                user_id_from: userIdFrom,
                comment_id_to: commentIdTo,
                activity_type_id: activityTypeId,
            },
            raw: true,
        });
    }
    static async doesUserVoteComment(userIdFrom, commentIdTo) {
        const result = await this.getModel().count({
            where: {
                user_id_from: userIdFrom,
                comment_id_to: commentIdTo,
            },
        });
        return !!result;
    }
    static getModel() {
        return models[TABLE_NAME];
    }
}
module.exports = ActivityUserCommentRepository;
