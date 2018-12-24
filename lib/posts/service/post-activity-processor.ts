const usersActivityRepository: UsersActivityRepository =
  require('../../users/repository/users-activity-repository');
const tagsParser = require('../../tags/service/tags-parser-service');
const tagsProcessor = require('../../tags/service/tags-processor-service');
const entityTagsRepo = require('../../tags/repository/entity-tags-repository');

const postsModelProvider: any = require('../../posts/service/posts-model-provider');

class PostActivityProcessor {
  /**
   *
   * @param {number} activityId
   */
  static async processOneActivity(activityId: number) {
    const activity: activityWithContentEntity | null =
      await usersActivityRepository.findOneWithPostById(activityId);

    if (!activity) {
      console.log(
        `Given activity ID ${activityId}
        do not represent activity with post. Or should be skipped.`,
      );

      return;
    }

    const [inputData, existingData] = await Promise.all([
      tagsParser.parseTags(activity.post_description),
      entityTagsRepo.findAllByEntity(activity.entity_id, postsModelProvider.getEntityName()),
    ]);

    await tagsProcessor.processTags(activity, inputData, existingData);
  }
}

module.exports = PostActivityProcessor;
