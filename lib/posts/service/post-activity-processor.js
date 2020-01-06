"use strict";
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const TagsProcessorService = require("../../tags/service/tags-processor-service");
const MentionsProcessorService = require("../../mentions/service/mentions-processor-service");
class PostActivityProcessor {
    static async processOneActivity(activityId) {
        const activity = await UsersActivityRepository.findOneWithPostById(activityId);
        if (!activity) {
            // eslint-disable-next-line no-console
            console.log(`Given activity ID ${activityId}
        do not represent activity with post. Or should be skipped.`);
            return false;
        }
        console.log('lets process tag');
        await TagsProcessorService.processTags(activity);
        await MentionsProcessorService.processMentions(activity);
        return true;
    }
}
module.exports = PostActivityProcessor;
