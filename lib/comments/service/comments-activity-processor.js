"use strict";
const mentionsProcessor = require('../../mentions/service/mentions-processor-service');
const usersActivityRepository = require('../../users/repository/users-activity-repository');
class CommentsActivityProcessor {
    /**
     *
     * @param {number} activityId
     */
    static async processOneActivity(activityId) {
        const activity = await usersActivityRepository.findOneWithCommentById(activityId);
        if (!activity) {
            console.log(`Given activity ID ${activityId}
        do not represent activity with comment. Or should be skipped.`);
            return;
        }
        await mentionsProcessor.processMentions(activity);
    }
}
module.exports = CommentsActivityProcessor;
