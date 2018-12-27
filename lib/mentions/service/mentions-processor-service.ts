const tagsParser = require('../../tags/service/tags-parser-service');
const usersActivityService = require('../../users/user-activity-service');
const usersRepository = require('../../users/users-repository');

class MentionsProcessorService {
  public static async processMentions(activity) {
    const mentions = tagsParser.parseMentions(activity.post_description);

    const userAccountNameToId = await usersRepository.findUserIdsByAccountNames(mentions);

    const usersIds = Object.keys(userAccountNameToId).map(key => userAccountNameToId[key]);

    console.dir(usersIds);
    // tslint:disable-next-line
    for (let i = 0; i < usersIds.length; i++) {
      const mentionedUserId = usersIds[i];

      const mentionActivity = await usersActivityService.processUserMentionOtherUserInPost(
        activity.entity_id,
        activity.user_id_from,
        mentionedUserId, //// fetch user id by account name
      );
      console.log(`${mentionedUserId} is processed`);

      await usersActivityService.sendPayloadToRabbit(mentionActivity);
    }
  }
}

export = MentionsProcessorService;
