export {};

const mockHelper = require('../helpers/mock-helper');
const seedsHelper = require('../helpers/seeds-helper');
const notificationsHelper = require('../helpers/notifications-helper');
const commonHelper = require('../helpers/common-helper');

const postsGenerator    = require('../../generators/posts-generator');
const commentsGenerator = require('../../generators/comments-generator');
const orgGenerator      = require('../../generators/organizations-generator');

const eventIdDictionary   = require('../../../lib/entities/dictionary').EventId;

let userVlad;
let userJane;
let userPetr;

const JEST_TIMEOUT = 10000;

describe('Mentions parsing by consumer', () => {
  beforeAll(async () => {
    mockHelper.mockAllTransactionSigning();
    mockHelper.mockAllBlockchainJobProducers();
  });
  afterAll(async () => {
    await seedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await seedsHelper.beforeAllRoutine();
  });

  describe('Creating - mentions for new comments from org', () => {
    describe('Comment by org on post', () => {
      it('Create notification based on one mention', async () => {
        const description = `hello @${userPetr.account_name} from comment`;

        const orgId = await orgGenerator.createOrgWithoutTeam(userJane);
        const postId: number =
          await postsGenerator.createMediaPostOfOrganization(userJane, orgId);
        const comment: any =
          await commentsGenerator.createCommentForPost(postId, userJane, description);

        expect(comment.organization_id).toBe(orgId);

        const options = {
          postProcessing: 'notification',
        };

        const mentionNotification =
          await notificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

        commonHelper.checkUserMentionsYouInsideComment(
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
            await commentsGenerator.createCommentForPost(postId, userVlad);

          const commentOnComment: any = await commentsGenerator.createCommentOnComment(
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
            await notificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          commonHelper.checkUserMentionsYouInsideComment(
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
            await commentsGenerator.createCommentForPost(postId, userVlad, description);

          const options = {
            postProcessing: 'notification',
          };

          const mentionNotification =
            await notificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          commonHelper.checkUserMentionsYouInsideComment(
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
            await commentsGenerator.createCommentForPost(postId, userVlad, description);

          const options = {
            postProcessing: 'notification',
          };

          const petrMentionNotification =
            await notificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          commonHelper.checkUserMentionsYouInsideComment(
            petrMentionNotification[0],
            options,
            comment.id,
            userVlad.id,
            userPetr.id,
          );

          const janeNotifications =
            await notificationsHelper.requestToGetExactNotificationsAmount(userJane, 2);

          expect(janeNotifications.some(
              item => item.event_id === eventIdDictionary.getUserCommentsPost(),
          )).toBeTruthy();

          const janeMention = janeNotifications.find(
              item => item.event_id === eventIdDictionary.getUserHasMentionedYouInComment(),
          );

          commonHelper.checkUserMentionsYouInsideComment(
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
            await commentsGenerator.createCommentForPost(postId, userVlad);

          const commentOnComment: any = await commentsGenerator.createCommentOnComment(
            postId,
            comment.id,
            userJane,
            description,
          );

          const options = {
            postProcessing: 'notification',
          };

          const mentionNotification =
            await notificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          commonHelper.checkUserMentionsYouInsideComment(
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
            await commentsGenerator.createCommentForPost(postId, userVlad);

          const commentOnComment: any = await commentsGenerator.createCommentOnComment(
            postId,
            comment.id,
            userJane,
            description,
          );

          const options = {
            postProcessing: 'notification',
          };

          const mentionNotification =
            await notificationsHelper.requestToGetExactNotificationsAmount(userPetr, 1);

          commonHelper.checkUserMentionsYouInsideComment(
            mentionNotification[0],
            options,
            commentOnComment.id,
            userJane.id,
            userPetr.id,
          );

          const janeNotifications =
            await notificationsHelper.requestToGetExactNotificationsAmount(userJane, 2);

          expect(janeNotifications.some(
            item => item.event_id === eventIdDictionary.getUserCommentsPost(),
          )).toBeTruthy();

          const janeMention = janeNotifications.find(
            item => item.event_id === eventIdDictionary.getUserHasMentionedYouInComment(),
          );
          // Yes this is a feature - Jane can mention herself
          commonHelper.checkUserMentionsYouInsideComment(
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

        const notification = await notificationsHelper.requestToGetOnlyOneNotification(userPetr);

        const options = {
          postProcessing: 'notification',
        };

        commonHelper.checkUserMentionsYouInsidePost(
          notification,
          options,
          expectedPostId,
          userVlad.id,
          userPetr.id,
        );
      }, JEST_TIMEOUT);

      it('Create notification based on one mention', async () => {
        const newPostFields = {
          description: `Our @${userPetr.account_name} super post description`,
        };

        const expectedPost = await postsGenerator.createUserDirectPostForOtherUser(
          userVlad,
          userJane,
          newPostFields.description,
        );

        const notification = await notificationsHelper.requestToGetOnlyOneNotification(userPetr);

        const options = {
          postProcessing: 'notification',
        };

        commonHelper.checkUserMentionsYouInsidePost(
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
          await notificationsHelper.requestToGetExactNotificationsAmount(userJane, 2);

        expect(notifications.some(
          item => item.event_id === eventIdDictionary.getUserCreatesDirectPostForOtherUser()),
        ).toBeTruthy();

        const mentionNotification = notifications.find(
          item => item.event_id === eventIdDictionary.getUserHasMentionedYouInPost(),
        );

        commonHelper.checkUserMentionsYouInsidePost(
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
