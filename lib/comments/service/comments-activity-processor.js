"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const mentionsProcessor = require('../../mentions/service/mentions-processor-service');
const usersActivityRepository = require('../../users/repository/users-activity-repository');
class CommentsActivityProcessor {
    /**
     *
     * @param {number} activityId
     */
    static processOneActivity(activityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const activity = yield usersActivityRepository.findOneWithCommentById(activityId);
            if (!activity) {
                console.log(`Given activity ID ${activityId}
        do not represent activity with comment. Or should be skipped.`);
                return;
            }
            yield mentionsProcessor.processMentions(activity);
        });
    }
}
module.exports = CommentsActivityProcessor;
