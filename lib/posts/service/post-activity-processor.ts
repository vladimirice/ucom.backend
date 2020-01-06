/* eslint-disable no-console */
import { ActivityWithContentEntity } from '../../users/interfaces/dto-interfaces';

import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import TagsProcessorService = require('../../tags/service/tags-processor-service');
import MentionsProcessorService = require('../../mentions/service/mentions-processor-service');


class PostActivityProcessor {
  public static async processOneActivity(
    activityId: number,
  ): Promise<boolean> {
    const activity: ActivityWithContentEntity | null =
      await UsersActivityRepository.findOneWithPostById(activityId);

    if (!activity) {
      // eslint-disable-next-line no-console
      console.log(
        `Given activity ID ${activityId}
        do not represent activity with post. Or should be skipped.`,
      );

      return false;
    }

    console.log('lets process tag');
    await TagsProcessorService.processTags(activity);
    await MentionsProcessorService.processMentions(activity);

    return true;
  }
}

export = PostActivityProcessor;
