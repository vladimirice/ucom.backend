"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const repo = require('../../users/repository/users-activity-repository');
const TagsParser = require('../../tags/service/tags-parser-service');
const TagsProcessor = require('../../tags/service/tags-processor-service');
const entityTagsRepo = require('../../tags/repository/entity-tags-repository');
const PostsModelProvider = require('../../posts/service/posts-model-provider');
class PostActivityProcessor {
    static processOneActivity(activityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const activity = yield repo.findOneWithPostById(activityId);
            if (activity === null) {
                throw new Error(`Given activity ID ${activityId} do not represent activity with post`);
            }
            const [inputData, existingData] = yield Promise.all([
                TagsParser.parseTags(activity.post_description),
                entityTagsRepo.findAllByEntity(activity.entity_id, PostsModelProvider.getEntityName())
            ]);
            yield TagsProcessor.processTags(activity, inputData, existingData);
        });
    }
}
module.exports = PostActivityProcessor;
