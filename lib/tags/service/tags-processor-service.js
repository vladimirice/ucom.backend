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
const tagsRepository = require('../repository/tags-repository');
const postsModelProvider = require('../../posts/service/posts-model-provider');
const postsRepository = require('../../posts/posts-repository');
const entityStateLogRepository = require('../../entities/repository/entity-state-log-repository');
const knex = require('../../../config/knex');
class TagsProcessorService {
    static processTags(activity, inputData, existingData) {
        return __awaiter(this, void 0, void 0, function* () {
            const [titlesToInsert, idsToDelete] = this.getTitlesToCreateAndIdsToDelete(inputData, existingData);
            console.dir(`Ids to delete: ${idsToDelete}`);
            const existingTags = yield tagsRepository.findAllTagsByTitles(titlesToInsert);
            yield knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const tagsToInsert = this.getTagsToInsert(titlesToInsert, activity, existingTags);
                let createdTags = {};
                if (tagsToInsert.length > 0) {
                    createdTags = yield tagsRepository.createNewTags(tagsToInsert, trx);
                }
                const tagModels = Object.assign({}, createdTags, existingTags);
                console.dir(tagModels);
                const entityTagsToInsert = this.getEntityTagsToInsert(titlesToInsert, activity, tagModels);
                yield entityTagsRepository.createNewEntityTags(entityTagsToInsert, trx);
                const processedPost = yield postsRepository.updatePostEntityTagsById(activity.entity_id, titlesToInsert, trx);
                yield entityStateLogRepository.insertNewState(activity.entity_id, postsModelProvider.getEntityName(), processedPost, trx);
                console.log('finish transaction ');
            }));
        });
    }
    static getTagsToInsert(titlesToInsert, activity, existingTags) {
        const tags = [];
        titlesToInsert.forEach((tagTitle) => {
            if (!existingTags[tagTitle]) {
                tags.push({
                    title: tagTitle,
                    first_entity_id: activity.entity_id,
                    first_entity_name: postsModelProvider.getEntityName(),
                });
            }
        });
        return tags;
    }
    static getEntityTagsToInsert(titlesToInsert, activity, tagModels) {
        const entityTags = [];
        titlesToInsert.forEach((tagTitle) => {
            const relatedTagModelId = tagModels[tagTitle];
            if (!relatedTagModelId) {
                throw new Error(`There is no related tag model for tag: ${tagTitle}`);
            }
            entityTags.push({
                tag_id: relatedTagModelId,
                tag_title: tagTitle,
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
