const repo: UsersActivityRepository = require('../../users/repository/users-activity-repository');
const TagsParser = require('../../tags/service/tags-parser-service');
const TagsProcessor = require('../../tags/service/tags-processor-service');
const entityTagsRepo = require('../../tags/repository/entity-tags-repository');

const PostsModelProvider: any = require('../../posts/service/posts-model-provider');

class PostActivityProcessor {
  static async processOneActivity(activityId: number) {
    const activity: activityWithContentEntity | null = await repo.findOneWithPostById(activityId);

    if (activity === null) {
      throw new Error(`Given activity ID ${activityId} do not represent activity with post`);
    }

    const [inputData, existingData] = await Promise.all([
      TagsParser.parseTags(activity.post_description),
      entityTagsRepo.findAllByEntity(activity.entity_id, PostsModelProvider.getEntityName())
    ]);

    await TagsProcessor.processTags(activity, inputData, existingData);
  }
}


module.exports = PostActivityProcessor;