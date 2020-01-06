/* eslint-disable no-console */
import { ActivityWithContentEntity } from '../../users/interfaces/dto-interfaces';

import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import MentionsProcessorService = require('../../mentions/service/mentions-processor-service');

class CommentsActivityProcessor {
  public static async processOneActivity(activityId: number): Promise<void> {
    const activity: ActivityWithContentEntity | null =
      await UsersActivityRepository.findOneWithCommentById(activityId);

    if (!activity) {
      console.log(
        `Given activity ID ${activityId}
        do not represent activity with comment. Or should be skipped.`,
      );

      return;
    }

    await MentionsProcessorService.processMentions(activity);
  }
}

export = CommentsActivityProcessor;
