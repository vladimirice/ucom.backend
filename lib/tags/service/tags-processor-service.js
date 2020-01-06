"use strict";
const TagsCurrentParamsRepository = require("../repository/tags-current-params-repository");
const _ = require('lodash');
const knex = require('../../../config/knex');
const entityTagsRepository = require('../repository/entity-tags-repository');
const tagsRepository = require('../repository/tags-repository');
const postsModelProvider = require('../../posts/service/posts-model-provider');
const postsRepository = require('../../posts/posts-repository');
const entityStateLogRepository = require('../../entities/repository/entity-state-log-repository');
const tagsParser = require('../../tags/service/tags-parser-service');
const entityTagsRepo = require('../../tags/repository/entity-tags-repository');
class TagsProcessorService {
    static async processTags(activity) {
        const [inputData, existingData] = await Promise.all([
            tagsParser.parseTags(activity.description),
            entityTagsRepo.findAllByEntity(activity.entity_id, postsModelProvider.getEntityName()),
        ]);
        const [titlesToInsert, entityTagsIdsToDelete] = this.getTitlesToInsertAndIdsToDelete(inputData, existingData);
        const existingTags = await tagsRepository.findAllTagsByTitles(titlesToInsert);
        await knex.transaction(async (trx) => {
            const tagsToInsert = this.getTagsToInsert(titlesToInsert, activity, existingTags);
            let createdTags = {};
            if (tagsToInsert.length > 0) {
                createdTags = await tagsRepository.createNewTags(tagsToInsert, trx);
                await TagsCurrentParamsRepository.insertManyRowsForNewEntity(Object.values(createdTags), trx);
            }
            const tagModels = Object.assign(Object.assign({}, createdTags), existingTags);
            const entityTagsToInsert = this.getEntityTagsToInsert(titlesToInsert, activity, tagModels);
            const [processedPost] = await Promise.all([
                postsRepository.updatePostEntityTagsById(activity.entity_id, inputData, trx),
                entityTagsRepository.createNewEntityTags(entityTagsToInsert, trx),
                entityTagsRepository.deleteEntityTagsByPrimaryKey(entityTagsIdsToDelete, trx),
            ]);
            await entityStateLogRepository.insertNewState(activity.entity_id, postsModelProvider.getEntityName(), processedPost, trx);
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
    /**
     *
     * @param {string[]} inputData
     * @param {Object} existingData
     *
     * @private
     */
    static getTitlesToInsertAndIdsToDelete(inputData, existingData) {
        // if something from input data does not exist inside existing data - this is data to insert
        // if something from existing data does not exist inside input data - this is data to delete
        const toInsert = _.difference(inputData, Object.keys(existingData));
        const toDelete = _.difference(Object.keys(existingData), inputData);
        const entityTagsIdsToDelete = [];
        toDelete.forEach((title) => {
            entityTagsIdsToDelete.push(+existingData[title]);
        });
        return [
            toInsert,
            entityTagsIdsToDelete,
        ];
    }
}
module.exports = TagsProcessorService;
