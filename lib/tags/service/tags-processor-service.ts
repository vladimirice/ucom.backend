import { ActivityWithContentEntity } from '../../users/interfaces/dto-interfaces';

import TagsCurrentParamsRepository = require('../repository/tags-current-params-repository');

const _     = require('lodash');
const knex  = require('../../../config/knex');

const entityTagsRepository: any = require('../repository/entity-tags-repository');
const tagsRepository            = require('../repository/tags-repository');
const postsModelProvider: any   = require('../../posts/service/posts-model-provider');
const postsRepository: any      = require('../../posts/posts-repository');
const entityStateLogRepository  = require('../../entities/repository/entity-state-log-repository');

const tagsParser = require('../../tags/service/tags-parser-service');
const entityTagsRepo = require('../../tags/repository/entity-tags-repository');

class TagsProcessorService {
  static async processTags(
    activity: ActivityWithContentEntity,
  ) {
    const [inputData, existingData]: [string[], Object] = await Promise.all([
      tagsParser.parseTags(activity.description),
      entityTagsRepo.findAllByEntity(activity.entity_id, postsModelProvider.getEntityName()),
    ]);

    const [titlesToInsert, entityTagsIdsToDelete] =
      this.getTitlesToInsertAndIdsToDelete(inputData, existingData);

    const existingTags: Object = await tagsRepository.findAllTagsByTitles(titlesToInsert);

    await knex.transaction(async (trx) => {
      const tagsToInsert: Object[]  = this.getTagsToInsert(titlesToInsert, activity, existingTags);

      let createdTags: Object = {};
      if (tagsToInsert.length > 0) {
        createdTags = await tagsRepository.createNewTags(tagsToInsert, trx);
        await TagsCurrentParamsRepository.insertManyRowsForNewEntity(Object.values(createdTags), trx);
      }

      const tagModels: Object = {
        ...createdTags,
        ...existingTags,
      };

      const entityTagsToInsert: Object[] =
          this.getEntityTagsToInsert(titlesToInsert, activity, tagModels);

      const [processedPost] = await Promise.all([
        postsRepository.updatePostEntityTagsById(activity.entity_id, inputData, trx),
        entityTagsRepository.createNewEntityTags(entityTagsToInsert, trx),
        entityTagsRepository.deleteEntityTagsByPrimaryKey(entityTagsIdsToDelete, trx),
      ]);

      await entityStateLogRepository.insertNewState(
        activity.entity_id,
        postsModelProvider.getEntityName(),
        processedPost,
        trx,
      );
    });
  }

  private static getTagsToInsert(
    titlesToInsert: string[],
    activity: ActivityWithContentEntity,
    existingTags: Object,
  ): Object[] {
    const tags: Object[] = [];

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

  private static getEntityTagsToInsert(
    titlesToInsert: string[],
    activity: ActivityWithContentEntity,
    tagModels: Object,
  ): Object[] {
    const entityTags: Object[] = [];

    titlesToInsert.forEach((tagTitle) => {
      const relatedTagModelId = tagModels[tagTitle];

      if (!relatedTagModelId) {
        throw new Error(`There is no related tag model for tag: ${tagTitle}`);
      }

      entityTags.push({
        tag_id:     relatedTagModelId,
        tag_title:  tagTitle,
        user_id:    activity.user_id_from,
        org_id:     activity.org_id,
        entity_id:  activity.entity_id,
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
  private static getTitlesToInsertAndIdsToDelete(
    inputData: string[],
    existingData: Object,
  ): [string[], number[]] {
    // if something from input data does not exist inside existing data - this is data to insert
    // if something from existing data does not exist inside input data - this is data to delete

    const toInsert: string[] = _.difference(inputData, Object.keys(existingData));

    const toDelete: string[] = _.difference(Object.keys(existingData), inputData);

    const entityTagsIdsToDelete: number[] = [];
    toDelete.forEach((title: string) => {
      entityTagsIdsToDelete.push(+existingData[title]);
    });

    return [
      toInsert,
      entityTagsIdsToDelete,
    ];
  }
}

export = TagsProcessorService;
