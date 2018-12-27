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
class MentionsProcessorService {
    static processMentions(activity) {
        return __awaiter(this, void 0, void 0, function* () {
            const mentions = tagsParser.parseMentions(activity.post_description);
            const userAccountNameToId = yield usersRepository.findUserIdsByAccountNames(mentions);
            const usersIds = Object.keys(userAccountNameToId).map(key => userAccountNameToId[key]);
            console.dir(usersIds);
            // tslint:disable-next-line
            for (let i = 0; i < usersIds.length; i++) {
                const mentionedUserId = usersIds[i];
                const mentionActivity = yield usersActivityService.processUserMentionOtherUserInPost(activity.entity_id, activity.user_id_from, mentionedUserId);
                console.log(`${mentionedUserId} is processed`);
                yield usersActivityService.sendPayloadToRabbit(mentionActivity);
            }
        });
    }
}
module.exports = MentionsProcessorService;
