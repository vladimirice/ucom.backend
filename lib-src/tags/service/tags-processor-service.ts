const entityTagsRepository    = require('../repository/entity-tags-repository');
const tagsRepo    = require('../repository/tags-repository');
const postsModelProvider: any = require('../../posts/service/posts-model-provider');

class TagsProcessorService {
  static async processTags(activity: activityWithContentEntity, inputData: string[], existingData: Object) {
    const [titlesToCreate, idsToDelete] = this.getTitlesToCreateAndIdsToDelete(inputData, existingData);

    console.dir(idsToDelete);
    // TODO createNewEntityTags

    const tagsToInsert: Object[]  = this.getTagsToInsert(titlesToCreate, activity);
    const createdTags: Object[]   = await tagsRepo.createNewTags(tagsToInsert);

    const entityTagsToInsert: Object[] = this.getEntityTagsToInsert(createdTags, activity);

    await entityTagsRepository.createNewEntityTags(entityTagsToInsert);
  }

  private static getTagsToInsert(titlesToCreate: string[], activity: activityWithContentEntity): Object[] {
    const tags: Object[] = [];

    titlesToCreate.forEach(tagTitle => {
      tags.push({
        title: tagTitle,
        first_entity_id: activity.entity_id,
        first_entity_name: postsModelProvider.getEntityName(),
      });
    });

    return tags;
  }

  private static getEntityTagsToInsert(createdTags: any[], activity: activityWithContentEntity): Object[] {
    const entityTags: Object[] = [];
    createdTags.forEach(tag => {
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

module.exports = TagsProcessorService;