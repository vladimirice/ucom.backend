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
            console.dir(idsToDelete);
            yield knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const tagsToInsert = this.getTagsToInsert(titlesToInsert, activity);
                if (tagsToInsert.length > 0) {
                    const createdTags = yield tagsRepository.createNewTags(tagsToInsert, trx);
                    const entityTagsToInsert = this.getEntityTagsToInsert(createdTags, activity);
                    yield entityTagsRepository.createNewEntityTags(entityTagsToInsert, trx);
                    const processedPost = yield postsRepository.updatePostEntityTagsById(activity.entity_id, titlesToInsert, trx);
                    yield entityStateLogRepository.insertNewState(activity.entity_id, postsModelProvider.getEntityName(), processedPost, trx);
                }
                else {
                    console.log('no tags. Nothing to insert.');
                }
            }));
        });
    }
    static getTagsToInsert(titlesToInsert, activity) {
        const tags = [];
        titlesToInsert.forEach((tagTitle) => {
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
        createdTags.forEach((tag) => {
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
