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

    console.dir(idsToDelete);

    await knex.transaction(async (trx) => {
      const tagsToInsert: Object[]  = this.getTagsToInsert(titlesToInsert, activity);

      if (tagsToInsert.length > 0) {
        const createdTags: Object[]   = await tagsRepository.createNewTags(tagsToInsert, trx);
        const entityTagsToInsert: Object[] = this.getEntityTagsToInsert(createdTags, activity);
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
      } else {
        console.log('no tags. Nothing to insert.');
      }
    });
  }

  private static getTagsToInsert(
    titlesToInsert: string[],
    activity: activityWithContentEntity,
  ): Object[] {
    const tags: Object[] = [];

    titlesToInsert.forEach((tagTitle) => {
      tags.push({
        title: tagTitle,
        first_entity_id: activity.entity_id,
        first_entity_name: postsModelProvider.getEntityName(),
      });
    });

    return tags;
  }

  private static getEntityTagsToInsert(
    createdTags: any[],
    activity: activityWithContentEntity,
  ): Object[] {
    const entityTags: Object[] = [];
    createdTags.forEach((tag) => {
      entityTags.push({
        tag_id:     tag.id,
        tag_title:  tag.title,
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
