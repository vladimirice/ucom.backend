const entityTagsRepository: any = require('../repository/entity-tags-repository');
const tagsRepository            = require('../repository/tags-repository');
const postsModelProvider: any   = require('../../posts/service/posts-model-provider');
const postsRepository: any      = require('../../posts/posts-repository');
const entityStateLogRepository  = require('../../entities/repository/entity-state-log-repository');

const knex = require('../../../config/knex');

class TagsProcessorService {
  static async processTags(
    activity: activityWithContentEntity,
    inputData: string[],
    existingData: Object,
  ) {
    const [titlesToInsert, idsToDelete] =
      this.getTitlesToCreateAndIdsToDelete(inputData, existingData);

    console.dir(`Ids to delete: ${idsToDelete}`);

    const existingTags: Object = await tagsRepository.findAllTagsByTitles(titlesToInsert);

    await knex.transaction(async (trx) => {
      const tagsToInsert: Object[]  = this.getTagsToInsert(titlesToInsert, activity, existingTags);

      let createdTags: Object = {};
      if (tagsToInsert.length > 0) {
        createdTags = await tagsRepository.createNewTags(tagsToInsert, trx);
      }

      const tagModels: Object = {
        ...createdTags,
        ...existingTags,
      };

      console.dir(tagModels);

      const entityTagsToInsert: Object[] =
          this.getEntityTagsToInsert(titlesToInsert, activity, tagModels);

      await entityTagsRepository.createNewEntityTags(entityTagsToInsert, trx);

      const processedPost = await postsRepository.updatePostEntityTagsById(
          activity.entity_id,
          titlesToInsert,
          trx,
        );

      await entityStateLogRepository.insertNewState(
          activity.entity_id,
          postsModelProvider.getEntityName(),
          processedPost,
          trx,
        );

      console.log('finish transaction ');

    });

  }

  private static getTagsToInsert(
    titlesToInsert: string[],
    activity: activityWithContentEntity,
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
    activity: activityWithContentEntity,
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

  private static getTitlesToCreateAndIdsToDelete(inputData: string[], existingData: Object) {
    if (Object.keys(existingData).length !== 0) {
      throw new Error('You must implement tags updating logic');
    }

    return [
      inputData,
      [], // TODO - tags updating
    ];
  }
}

export = TagsProcessorService;
