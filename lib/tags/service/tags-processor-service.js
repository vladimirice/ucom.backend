"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const entityTagsRepository = require('../repository/entity-tags-repository');
const tagsRepo = require('../repository/tags-repository');
const postsModelProvider = require('../../posts/service/posts-model-provider');
class TagsProcessorService {
    static processTags(activity, inputData, existingData) {
        return __awaiter(this, void 0, void 0, function* () {
            const [titlesToCreate, idsToDelete] = this.getTitlesToCreateAndIdsToDelete(inputData, existingData);
            console.dir(idsToDelete);
            // TODO createNewEntityTags
            const tagsToInsert = this.getTagsToInsert(titlesToCreate, activity);
            const createdTags = yield tagsRepo.createNewTags(tagsToInsert);
            const entityTagsToInsert = this.getEntityTagsToInsert(createdTags, activity);
            yield entityTagsRepository.createNewEntityTags(entityTagsToInsert);
        });
    }
    static getTagsToInsert(titlesToCreate, activity) {
        const tags = [];
        titlesToCreate.forEach(tagTitle => {
            tags.push({
                title: tagTitle,
                first_entity_id: activity.entity_id,
                first_entity_name: postsModelProvider.getEntityName(),
            });
        });
        return tags;
    }
    static getEntityTagsToInsert(createdTags, activity) {
        const entityTags = [];
        createdTags.forEach(tag => {
            entityTags.push({
                tag_id: tag.id,
                tag_title: tag.title,
                user_id: activity.user_id_from,
                org_id: activity.org_id,
                entity_id: activity.entity_id,
                entity_name: postsModelProvider.getEntityName(),
            });
        });
        return entityTags;
    }
    static getTitlesToCreateAndIdsToDelete(inputData, existingData) {
        if (Object.keys(existingData).length !== 0) {
            throw new Error('You must implement tags updating logic');
        }
        return [
            inputData,
            [],
        ];
    }
}
module.exports = TagsProcessorService;
