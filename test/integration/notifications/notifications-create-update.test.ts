export {};

const _ = require('lodash');
const gen = require('../../generators');
const orgGen = gen.Org;

const delay = require('delay');

const usersTeamStatusDictionary = require('../../../lib/users/dictionary').UsersTeamStatus;

const eventIdDictionary = require('../../../lib/entities/dictionary').EventId;

const usersTeamRepository = require('../../../lib/users/repository').UsersTeam;
const orgModelProvider    = require('../../../lib/organizations/service').ModelProvider;

const helpers = require('../helpers');

let userVlad;
let userJane;
let userPetr;
let userRokky;

const JEST_TIMEOUT = 10000;

helpers.Mock.mockAllTransactionSigning();
helpers.Mock.mockAllBlockchainJobProducers();

describe('Notifications create-update', () => {
  afterAll(async () => {
    // await helpers.SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();

    await Promise.all([
      helpers.SeedsHelper.seedOrganizations(),
      helpers.SeedsHelper.seedPosts(),
    ]);
  });

  describe('Repost notifications', () => {
    describe('Positive', () => {
      it('somebody shares your own post', async () => {
        const parentPostId = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const repostId = await gen.Posts.createRepostOfUserPost(userJane, parentPostId);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserRepostsOtherUserPost(
          notification,
          options,
          repostId,
          parentPostId,
        );
      }, JEST_TIMEOUT);

      it('somebody shares your organization post', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);

        const parentPostId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);
        const repostId = await gen.Posts.createRepostOfUserPost(userJane, parentPostId);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserRepostsOrgPost(
          notification,
          options,
          repostId,
          parentPostId,
        );
      }, JEST_TIMEOUT);
    });
  });

  describe('Direct post notifications', () => {
    describe('Positive', () => {
      it('User creates direct post for other user', async () => {
        await gen.Posts.createUserDirectPostForOtherUser(userJane, userVlad);

        let notifications = [];
        while (_.isEmpty(notifications)) {
          notifications =
            await helpers.Notifications.requestToGetOnlyOneNotificationBeforeReceive(userVlad);
          delay(100);
        }

        expect(notifications.length).toBe(1);

        const notification: any = notifications[0];

        expect(notification.event_id)
          .toBe(eventIdDictionary.getUserCreatesDirectPostForOtherUser());

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkOneNotificationsFromList(notification, options);
      });

      it('User creates direct post for organization', async () => {
        const orgId   = await gen.Org.createOrgWithTeam(userVlad);

        await gen.Posts.createDirectPostForOrganization(userJane, orgId);

        let notifications = [];
        while (_.isEmpty(notifications)) {
          notifications =
            await helpers.Notifications.requestToGetOnlyOneNotificationBeforeReceive(userVlad);
          delay(100);
        }

        expect(notifications.length).toBe(1);

        const notification: any = notifications[0];

        expect(notification.event_id).toBe(eventIdDictionary.getUserCreatesDirectPostForOrg());

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkOneNotificationsFromList(notification, options);
      }, JEST_TIMEOUT);
    });
  });

  describe('User to user comments notifications', () => {
    it('User comments your post', async () => {
      const postAuthor = userVlad;
      const commentAuthor = userJane;

      const postId = await gen.Posts.createMediaPostByUserHimself(postAuthor);
      await gen.Comments.createCommentForPost(postId, commentAuthor);

      let notifications = [];
      while (_.isEmpty(notifications)) {
        notifications =
          await helpers.Notifications.requestToGetOnlyOneNotificationBeforeReceive(userVlad);
        delay(100);
      }

      expect(notifications.length).toBe(1);

      const notification: any = notifications[0];

      expect(notification.event_id).toBe(eventIdDictionary.getUserCommentsPost());

      const options = {
        postProcessing: 'notification',
      };

      helpers.Common.checkOneNotificationsFromList(notification, options);
    }, JEST_TIMEOUT);

    it('User creates comment on your comment', async () => {
      const postAuthor = userVlad;
      const commentAuthor = userJane;

      const commentOnCommentAuthor = userVlad;

      const postId      = await gen.Posts.createMediaPostByUserHimself(postAuthor);
      const newComment  = await gen.Comments.createCommentForPost(postId, commentAuthor);

      await gen.Comments.createCommentOnComment(postId, newComment.id, commentOnCommentAuthor);

      let notification;

      while (!notification) {
        const notifications =
          await helpers.Notifications.requestToGetOnlyOneNotificationBeforeReceive(userJane);
        notification = notifications[0];
        delay(100);
      }

      const options = {
        postProcessing: 'notification',
      };

      helpers.Common.checkOneNotificationsFromList(notification, options);
    }, JEST_TIMEOUT);

  });

  describe('User voting activity', () => {
    describe('User to post activity', () => {
      it('user UPVOTES other user post', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);
        await helpers.Posts.requestToUpvotePost(userJane, postId);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserUpvotesPostOfOtherUser(notification, options);
      });

      it('user DOWNVOTES other user post', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);
        await helpers.Posts.requestToDownvotePost(userJane, postId);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserDownvotesPostOfOtherUser(notification, options);
      });

      it('user UPVOTES post of organization', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);
        await helpers.Posts.requestToUpvotePost(userJane, postId);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserUpvotesPostOfOrg(notification, options);
      });

      it('user DOWNVOTES post of organization', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);
        await helpers.Posts.requestToDownvotePost(userJane, postId);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserDownvotesPostOfOrg(notification, options);
      });
    });

    describe('User to post comment activity', () => {
      it('user UPVOTES other user comment', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await helpers.Comments.requestToUpvoteComment(postId, comment.id, userJane);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserUpvotesCommentOfOtherUser(notification, options);
      });

      it('user DOWNVOTES other user comment', async () => {
        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await helpers.Comments.requestToDownvoteComment(postId, comment.id, userJane);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserDownvotesCommentOfOtherUser(notification, options);
      });

      it('user UPVOTES comment of organization', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);
        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await helpers.Comments.requestToUpvoteComment(postId, comment.id, userJane);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserUpvotesCommentOfOrg(notification, options);
      });

      it('user DOWNVOTES comment of organization', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);
        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await helpers.Comments.requestToDownvoteComment(postId, comment.id, userJane);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkUserDownvotesCommentOfOrg(notification, options);
      });
    });
  });

  describe('User to org content comments notifications', () => {
    describe('Positive', () => {
      it('User creates comment on organization comment', async () => {
        const orgAuthor           = userVlad;
        const commentReplyAuthor  = userJane;

        const orgId = await gen.Org.createOrgWithoutTeam(orgAuthor);
        const orgPostId = await gen.Posts.createMediaPostOfOrganization(orgAuthor, orgId);

        const comment = await gen.Comments.createCommentForPost(orgPostId, orgAuthor);

        await gen.Comments.createCommentOnComment(orgPostId, comment.id, commentReplyAuthor);

        let notifications = [];
        while (_.isEmpty(notifications)) {
          notifications =
            await helpers.Notifications.requestToGetOnlyOneNotificationBeforeReceive(orgAuthor);
          delay(100);
        }

        // Should not create notification when user creates comment on his own post. See above
        expect(notifications.length).toBe(1);

        const notification: any = notifications[0];

        expect(notification.event_id).toBe(eventIdDictionary.getUserCommentsOrgComment());

        helpers.Common.checkUserCommentsOrgCommentNotification(notification);
      });
      it('User creates comment on organization post', async () => {
        const orgAuthor = userVlad;
        const commentAuthor = userJane;

        const orgId = await gen.Org.createOrgWithoutTeam(orgAuthor);
        const orgPostId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);

        await gen.Comments.createCommentForPost(orgPostId, commentAuthor);

        let notification;

        while (!notification) {
          delay(100);
          const notifications =
            await helpers.Notifications.requestToGetOnlyOneNotificationBeforeReceive(orgAuthor);
          notification = notifications[0];
        }

        const options = {
          postProcessing: 'notification',
        };

        helpers.Common.checkOneNotificationsFromList(notification, options);
      }, 10000);

      it.skip('should not create notification if user comments his own post', async () => {
      });

      it.skip('Check exact user comments your post notification content', async () => {
      });
    });
  });

  describe('Organizations. Follow', () => {
    describe('Positive', () => {
      it('should create notification - somebody follows your organization', async () => {
        const orgId = await orgGen.createOrgWithoutTeam(userVlad);
        await helpers.Org.requestToFollowOrganization(orgId, userJane);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);
        helpers.Common.checkUserFollowsOrgNotification(notification);
      });
    });
    describe('Negative', () => {
      it.skip('No notification for unfollow', async () => {
      });
    });

  });

  describe('Users. Follow', () => {
    describe('Positive', () => {
      it('should create follow notification', async () => {
        await helpers.Activity.requestToCreateFollow(userJane, userVlad);
        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);

        helpers.Common.checkUserFollowsYouNotification(notification);
      });
    });

    describe('Negative', () => {
      it.skip('No notification for unfollow', async () => {
      });
    });
  });

  describe('Organizations. Users team. Team invitation', () => {
    describe('Positive', () => {
      it('Create valid prompt notification when org is created.', async () => {
        const author = userVlad;

        const teamMembers = [
          userJane,
          userPetr,
        ];

        const newOrgId = await orgGen.createOrgWithTeam(author, teamMembers);

        const janeNotification =
          await helpers.Notifications.requestToGetOnlyOneNotification(userJane);

        helpers.Notifications.checkUsersTeamInvitationPromptFromDb(
          janeNotification,
          userJane.id,
          newOrgId,
          true,
        );
        helpers.Common.checkOrgUsersTeamInvitationNotification(janeNotification);

        const petrNotifications =
          await helpers.Notifications.requestToGetNotificationsList(userPetr);
        // One notification for Petr - join invitation
        expect(petrNotifications.length).toBe(1);

        helpers.Notifications.checkUsersTeamInvitationPromptFromDb(
          petrNotifications[0],
          userPetr.id,
          newOrgId,
          true,
        );
        helpers.Common.checkOrgUsersTeamInvitationNotification(petrNotifications[0]);

        const rokkyNotifications =
          await helpers.Notifications.requestToGetNotificationsList(userRokky);
        // Rokky is not a team member so no notifications
        expect(_.isEmpty(rokkyNotifications)).toBeTruthy();

        const vladNotifications =
          await helpers.Notifications.requestToGetNotificationsList(userVlad);
        // Vlad himself should not to receive any notifications
        expect(_.isEmpty(vladNotifications)).toBeTruthy();

      }, 10000);

      it.skip('should create valid users activity record related to board invitation', async () => {
      });

      it('should receive notification if board is updated - new members are added', async () => {
        // create notification if user is added to the board after updating

        const author = userVlad;
        const teamMembers = [
          userJane,
          userPetr,
        ];

        const newOrgId = await orgGen.createOrgWithTeam(author, teamMembers);

        const newTeamMembers = _.concat(teamMembers, userRokky);

        await orgGen.updateOrgUsersTeam(newOrgId, author, newTeamMembers);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userRokky);

        helpers.Notifications.checkUsersTeamInvitationPromptFromDb(
          notification,
          userRokky.id,
          newOrgId,
          true,
        );
      }, 10000);

      it('should properly CONFIRM users team invitation prompt', async () => {
        const author = userVlad;

        const teamMembers = [
          userJane,
          userPetr,
        ];

        const newOrgId = await orgGen.createOrgWithTeam(author, teamMembers);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userJane);
        const confirmed =
          await helpers.Notifications.requestToConfirmPrompt(userJane, notification.id);

        const options = {
          myselfData: true,
        };

        helpers.Common.checkOneNotificationsFromList(confirmed, options);

        helpers.Notifications.checkUsersTeamInvitationPromptFromDb(
          confirmed,
          userJane.id,
          newOrgId,
          false,
          'confirmed',
        );

        // get organizations board and see that status is confirmed

        const org = await helpers.Org.requestToGetOneOrganizationAsGuest(newOrgId);

        const usersTeam = org.users_team;

        const userJaneMember = usersTeam.find(data => data.id === userJane.id);
        expect(userJaneMember.users_team_status)
          .toBe(usersTeamStatusDictionary.getStatusConfirmed());
      }, 10000);

      it('should properly DECLINE users team invitation prompt', async () => {
        const author = userVlad;

        const teamMembers = [
          userJane,
          userPetr,
        ];

        const newOrgId = await orgGen.createOrgWithTeam(author, teamMembers);

        const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userPetr);
        const declined =
          await helpers.Notifications.requestToDeclinePrompt(userPetr, notification.id);

        const options = {
          myselfData: true,
        };

        helpers.Common.checkOneNotificationsFromList(declined, options);

        helpers.Notifications.checkUsersTeamInvitationPromptFromDb(
          declined,
          userPetr.id,
          newOrgId,
          false,
          'declined',
        );

        // get organizations board and see that status is confirmed

        const usersTeam = await usersTeamRepository.findAllRelatedToEntity(
          orgModelProvider.getEntityName(),
          newOrgId,
        );

        const userPetrMember = usersTeam.find(data => data.user_id === userPetr.id);
        expect(userPetrMember.status).toBe(usersTeamStatusDictionary.getStatusDeclined());
      });

      it.skip('should delete pending notifications if user is deleted from the board', async () => {
      });

      it('should provide users team status of organization', async () => {
        const author = userVlad;
        const teamMembers = [
          userJane,
          userPetr,
          userRokky,
        ];

        const newOrgId = await orgGen.createOrgWithTeam(author, teamMembers);

        const org = await helpers.Org.requestToGetOneOrganizationAsGuest(newOrgId);

        const usersTeam = org.users_team;

        usersTeam.forEach((member) => {
          expect(member.users_team_status).toBeDefined();
          expect(member.users_team_status).toBe(usersTeamStatusDictionary.getStatusPending());
        });
      });
    });

    describe('Negative', () => {
      it.skip('not possible to interact with notification does not belong to you', async () => {
      });
    });
  });

  describe('Seen API', () => {

    it('mark prompt notification as seen. Should NOT be finished', async () => {
      const author = userVlad;
      const teamMembers = [userJane, userPetr];

      await orgGen.createOrgWithTeam(author, teamMembers);

      const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userJane);

      const seen =
        await helpers.Notifications.requestToMarkNotificationSeen(userJane, notification.id);

      const options = {
        myselfData: true,
      };

      helpers.Common.checkOneNotificationsFromList(seen, options);

      await helpers.Notifications.checkPromptNotificationIsSeenButNotFinished(seen);
    });

    it('mark alert notification as seen. Should be finished', async () => {
      await helpers.Activity.requestToCreateFollow(userVlad, userJane);

      const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userJane);

      const seen =
        await helpers.Notifications.requestToMarkNotificationSeen(userJane, notification.id);

      const options = {
        myselfData: true,
      };

      helpers.Common.checkOneNotificationsFromList(seen, options);

      await helpers.Notifications.checkAlertNotificationIsSeen(seen);
    });
  });

  // tslint:disable-next-line:max-line-length
  it.skip('should properly count unread_messages_count after seen or prompt answer actions', async () => {
  });
});
