"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const tagsParser = require('../../tags/service/tags-parser-service');
const usersActivityService = require('../../users/user-activity-service');
const usersRepository = require('../../users/users-repository');
const postsModelProvider = require('../../posts/service/posts-model-provider');
const commentsModelProvider = require('../../comments/service/comments-model-provider');
class MentionsProcessorService {
    static processMentions(activity) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Activity is: ${JSON.stringify(activity, null, 2)}`);
            const mentions = tagsParser.parseMentions(activity.description);
            console.log(`Mentions are: ${mentions}`);
            const userAccountNameToId = yield usersRepository.findUserIdsByAccountNames(mentions);
            const usersIds = Object.keys(userAccountNameToId).map(key => userAccountNameToId[key]);
            for (let i = 0; i < usersIds.length; i += 1) {
                const mentionedUserId = usersIds[i];
                console.log(`Mentioned user id: ${mentionedUserId}`);
                yield this.processNotificationActivity(activity, mentionedUserId);
            }
        });
    }
    static processNotificationActivity(activity, mentionedUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            let mentionActivity;
            if (activity.entity_name === postsModelProvider.getEntityName()) {
                mentionActivity = yield usersActivityService.processUserMentionOtherUserInPost(activity.entity_id, activity.user_id_from, mentionedUserId);
            }
            else if (activity.entity_name === commentsModelProvider.getEntityName()) {
                mentionActivity = yield usersActivityService.processUserMentionOtherUserInComment(activity.entity_id, activity.user_id_from, mentionedUserId);
            }
            else {
                throw new Error(`Unknown entity name ${activity.entity_name}`);
            }
            yield usersActivityService.sendPayloadToRabbit(mentionActivity);
        });
    }
}
module.exports = MentionsProcessorService;
