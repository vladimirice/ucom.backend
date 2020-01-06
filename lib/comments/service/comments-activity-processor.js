"use strict";
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const MentionsProcessorService = require("../../mentions/service/mentions-processor-service");
class CommentsActivityProcessor {
    static async processOneActivity(activityId) {
        const activity = await UsersActivityRepository.findOneWithCommentById(activityId);
        if (!activity) {
            console.log(`Given activity ID ${activityId}
        do not represent activity with comment. Or should be skipped.`);
            return;
        }
        await MentionsProcessorService.processMentions(activity);
    }
}
module.exports = CommentsActivityProcessor;
