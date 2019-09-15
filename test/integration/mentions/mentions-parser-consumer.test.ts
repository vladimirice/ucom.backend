import { EventsIdsDictionary } from 'ucom.libs.common';

import SeedsHelper = require('../helpers/seeds-helper');
import CommentsGenerator = require('../../generators/comments-generator');
import NotificationsHelper = require('../helpers/notifications-helper');
import CommonHelper = require('../helpers/common-helper');


const postsGenerator    = require('../../generators/posts-generator');
const orgGenerator      = require('../../generators/organizations-generator');

let userVlad;
let userJane;
let userPetr;

const JEST_TIMEOUT = 10000;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

describe('Mentions parsing by consumer', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });

  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Creating - mentions for new comments from org', () => {
    describe('Comment by org on post', () => {
      it('Create notification based on one mention', async () => {
        const description = `hello @${userPetr.account_name} from comment`;

        const orgId = await orgGenerator.createOrgWithoutTeam(userJane);
        const postId: number =
          await postsGenerator.createMediaPostOfOrganization(userJane, orgId);
        const comment: any =
          await CommentsGenerator.createCommentForPost(postId, userJane, description);

        expect(comment.organization_id).toBe(orgId);

        const options = {
          postProcessing: 'notification',
        };

        const mentionNotification =
          await NotificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

        CommonHelper.checkUserMentionsYouInsideComment(
          mentionNotification[0],
          options,
          comment.id,
          userJane.id,
          userPetr.id,
        );
      }, JEST_TIMEOUT);
      describe('Comment on comment', () => {
        it('Create notification based on one mention', async () => {
          const description = `hello @${userPetr.account_name} from comment`;

          const orgId = await orgGenerator.createOrgWithoutTeam(userJane);
          const postId: number =
            await postsGenerator.createMediaPostOfOrganization(userJane, orgId);

          const comment: any =
            await CommentsGenerator.createCommentForPost(postId, userVlad);

          const commentOnComment: any = await CommentsGenerator.createCommentOnComment(
            postId,
            comment.id,
            userJane,
            description,
          );

          expect(commentOnComment.organization_id).toBe(orgId);

          const options = {
            postProcessing: 'notification',
          };

          const mentionNotification =
            await NotificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          CommonHelper.checkUserMentionsYouInsideComment(
            mentionNotification[0],
            options,
            commentOnComment.id,
            userJane.id,
            userPetr.id,
          );
        }, JEST_TIMEOUT);
      });
    });
  });

  describe('Notification related to mentions', () => {
    describe('Creating - mentions for new comments', () => {
      describe('Comment on post', () => {
        it('Create notification based on one mention', async () => {
          const description = `hello @${userPetr.account_name} from comment`;

          const postId: number = await postsGenerator.createMediaPostByUserHimself(userJane);
          const comment: any =
            await CommentsGenerator.createCommentForPost(postId, userVlad, description);

          const options = {
            postProcessing: 'notification',
          };

          const mentionNotification =
            await NotificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          CommonHelper.checkUserMentionsYouInsideComment(
            mentionNotification[0],
            options,
            comment.id,
            userVlad.id,
            userPetr.id,
          );
        }, JEST_TIMEOUT);

        it('Create notification based on two mention', async () => {
          const description =
            `hello @${userPetr.account_name} @${userJane.account_name} from comment`;

          const postId: number = await postsGenerator.createMediaPostByUserHimself(userJane);
          const comment: any =
            await CommentsGenerator.createCommentForPost(postId, userVlad, description);

          const options = {
            postProcessing: 'notification',
          };

          const petrMentionNotification =
            await NotificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          CommonHelper.checkUserMentionsYouInsideComment(
            petrMentionNotification[0],
            options,
            comment.id,
            userVlad.id,
            userPetr.id,
          );

          const janeNotifications =
            await NotificationsHelper.requestToGetExactNotificationsAmount(userJane, 2);

          expect(janeNotifications.some(
            (item: any) => item.event_id === EventsIdsDictionary.getUserCommentsPost(),
          )).toBeTruthy();

          const janeMention = janeNotifications.find(
            (item: any) => item.event_id === EventsIdsDictionary.getUserHasMentionedYouInComment(),
          );

          CommonHelper.checkUserMentionsYouInsideComment(
            janeMention,
            options,
            comment.id,
            userVlad.id,
            userJane.id,
          );
        }, JEST_TIMEOUT);
      });

      describe('Comment on comment', () => {
        it('Create notification based on one mention', async () => {
          const description = `hello @${userPetr.account_name} from comment`;

          const postId: number = await postsGenerator.createMediaPostByUserHimself(userJane);
          const comment: any =
            await CommentsGenerator.createCommentForPost(postId, userVlad);

          const commentOnComment: any = await CommentsGenerator.createCommentOnComment(
            postId,
            comment.id,
            userJane,
            description,
          );

          const options = {
            postProcessing: 'notification',
          };

          const mentionNotification =
            await NotificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          CommonHelper.checkUserMentionsYouInsideComment(
            mentionNotification[0],
            options,
            commentOnComment.id,
            userJane.id,
            userPetr.id,
          );
        }, JEST_TIMEOUT);
        it('Create notification based on two mentions', async () => {
          const description =
            `hello @${userPetr.account_name} @${userJane.account_name} from comment`;

          const postId: number = await postsGenerator.createMediaPostByUserHimself(userJane);
          const comment: any =
            await CommentsGenerator.createCommentForPost(postId, userVlad);

          const commentOnComment: any = await CommentsGenerator.createCommentOnComment(
            postId,
            comment.id,
            userJane,
            description,
          );

          const options = {
            postProcessing: 'notification',
          };

          const mentionNotification =
            await NotificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          CommonHelper.checkUserMentionsYouInsideComment(
            mentionNotification[0],
            options,
            commentOnComment.id,
            userJane.id,
            userPetr.id,
          );

          const janeNotifications =
            await NotificationsHelper.requestToGetExactNotificationsAmount(userJane, 2);

          expect(janeNotifications.some(
            (item: any) => item.event_id === EventsIdsDictionary.getUserCommentsPost(),
          )).toBeTruthy();

          const janeMention = janeNotifications.find(
            (item: any) => item.event_id === EventsIdsDictionary.getUserHasMentionedYouInComment(),
          );
          // Yes this is a feature - Jane can mention herself
          CommonHelper.checkUserMentionsYouInsideComment(
            janeMention,
            options,
            commentOnComment.id,
            userJane.id,
            userJane.id,
          );
        }, JEST_TIMEOUT);
      });
    });

    describe('Creation - mentions for posts', () => {
      it('[Smoke] Media post and mentions', async () => {
        const newPostFields = {
          description: `Our @${userPetr.account_name} super post description`,
        };

        const expectedPostId = await postsGenerator.createMediaPostByUserHimself(
          userVlad,
          newPostFields,
        );

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userPetr);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserMentionsYouInsidePost(
          notification,
          options,
          expectedPostId,
          userVlad.id,
          userPetr.id,
        );
      }, JEST_TIMEOUT * 10);

      it('Create notification based on one mention', async () => {
        const newPostFields = {
          description: `Our @${userPetr.account_name} super post description`,
        };

        const expectedPost = await postsGenerator.createUserDirectPostForOtherUser(
          userVlad,
          userJane,
          newPostFields.description,
        );

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userPetr);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserMentionsYouInsidePost(
          notification,
          options,
          expectedPost.id,
          userVlad.id,
          userPetr.id,
        );
      }, JEST_TIMEOUT);

      it('Create notifications based on two mentions', async () => {
        const newPostFields = {
          description:
            `Our @${userPetr.account_name} @${userJane.account_name} super post description`,
        };

        const expectedPost = await postsGenerator.createUserDirectPostForOtherUser(
          userVlad,
          userJane,
          newPostFields.description,
        );

        const options = {
          postProcessing: 'notification',
        };

        const notifications =
          await NotificationsHelper.requestToGetExactNotificationsAmount(userJane, 2);

        expect(notifications.some(
          (item: any) => item.event_id === EventsIdsDictionary.userCreatesDirectPostForOtherUser(),
        )).toBeTruthy();

        const mentionNotification = notifications.find(
          (item: any) => item.event_id === EventsIdsDictionary.getUserHasMentionedYouInPost(),
        );

        CommonHelper.checkUserMentionsYouInsidePost(
          mentionNotification,
          options,
          expectedPost.id,
          userVlad.id,
          userJane.id,
        );
      }, 10000);
    });
  });

  describe('Skipped tests', () => {
    it.skip('Create mentions based on ones in media post description', async () => {
    });
    it.skip('If you mention user twice - only one notification should be sent', async () => {
    });
    it.skip('Direct post updating mentions', async () => {});
    it.skip('Org post updating mentions', async () => {});
  });
});

export {};
