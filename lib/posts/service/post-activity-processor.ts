const usersActivityRepository: UsersActivityRepository =
  require('../../users/repository/users-activity-repository');
const tagsProcessor     = require('../../tags/service/tags-processor-service');
const mentionsProcessor = require('../../mentions/service/mentions-processor-service');

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

    await tagsProcessor.processTags(activity);
    await mentionsProcessor.processMentions(activity);
  }
}

export = PostActivityProcessor;
