import { ActivityWithContentEntity } from '../../users/interfaces/dto-interfaces';

const tagsParser = require('../../tags/service/tags-parser-service');
const usersActivityService = require('../../users/user-activity-service');
const usersRepository = require('../../users/users-repository');

const postsModelProvider = require('../../posts/service/posts-model-provider');
const commentsModelProvider = require('../../comments/service/comments-model-provider');

class MentionsProcessorService {
  public static async processMentions(
    activity: ActivityWithContentEntity,
  ) {
    const mentions = tagsParser.parseMentions(activity.description);

    const userAccountNameToId = await usersRepository.findUserIdsByAccountNames(mentions);

    const usersIds = Object.keys(userAccountNameToId).map(key => userAccountNameToId[key]);

    for (let i = 0; i < <number>usersIds.length; i += 1) {
      const mentionedUserId = usersIds[i];

      await this.processNotificationActivity(activity, mentionedUserId);
    }
  }

  private static async processNotificationActivity(
    activity: ActivityWithContentEntity,
    mentionedUserId: number,
  ) {
    let mentionActivity;
    if (activity.entity_name === postsModelProvider.getEntityName()) {
      mentionActivity = await usersActivityService.processUserMentionOtherUserInPost(
        activity.entity_id,
        activity.user_id_from,
        mentionedUserId, // fetch user id by account name
      );
    } else if (activity.entity_name === commentsModelProvider.getEntityName()) {
      mentionActivity = await usersActivityService.processUserMentionOtherUserInComment(
        activity.entity_id,
        activity.user_id_from,
        mentionedUserId, // fetch user id by account name
      );
    } else {
      throw new Error(`Unknown entity name ${activity.entity_name}`);
    }

    await usersActivityService.sendPayloadToRabbit(mentionActivity);
  }
}

export = MentionsProcessorService;
