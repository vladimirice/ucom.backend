import { EventsIdsDictionary } from 'ucom.libs.common';

import MockHelper = require('../helpers/mock-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import NotificationsHelper = require('../helpers/notifications-helper');
import CommonHelper = require('../helpers/common-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsHelper = require('../helpers/posts-helper');
import CommentsGenerator = require('../../generators/comments-generator');
import CommentsHelper = require('../helpers/comments-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');
import ActivityHelper = require('../helpers/activity-helper');
import UsersTeamStatusDictionary = require('../../../lib/users/dictionary/users-team-status-dictionary');
import UsersTeamRepository = require('../../../lib/users/repository/users-team-repository');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
import UsersActivityRequestHelper = require('../../helpers/users/activity/users-activity-request-helper');

const _ = require('lodash');

const delay = require('delay');

let userVlad;
let userJane;
let userPetr;
let userRokky;

const JEST_TIMEOUT = 10000;

MockHelper.mockAllTransactionSigning();
MockHelper.mockAllBlockchainJobProducers();

describe('Notifications create-update', () => {
  afterAll(async () => {
    await SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();

    await Promise.all([
      SeedsHelper.seedOrganizations(),
      SeedsHelper.seedPosts(),
    ]);
  });

  describe('Repost notifications', () => {
    describe('Positive', () => {
      it('somebody shares your own post', async () => {
        const parentPostId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const repostId = await PostsGenerator.createRepostOfUserPost(userJane, parentPostId);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserRepostsOtherUserPost(
          notification,
          options,
          repostId,
          parentPostId,
        );
      }, JEST_TIMEOUT);

      it('somebody shares your organization post', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

        const parentPostId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);
        const repostId = await PostsGenerator.createRepostOfUserPost(userJane, parentPostId);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserRepostsOrgPost(
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
        await PostsGenerator.createUserDirectPostForOtherUser(userJane, userVlad);

        let notifications = [];
        while (_.isEmpty(notifications)) {
          notifications =
            await NotificationsHelper.requestToGetOnlyOneNotificationBeforeReceive(userVlad);
          await delay(100);
        }

        expect(notifications.length).toBe(1);

        const notification: any = notifications[0];

        expect(notification.event_id)
          .toBe(EventsIdsDictionary.userCreatesDirectPostForOtherUser());

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkOneNotificationsFromList(notification, options);
      });

      it('User creates direct post for organization', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithTeam(userVlad);

        await PostsGenerator.createDirectPostForOrganizationLegacy(userJane, orgId);

        let notifications = [];
        while (_.isEmpty(notifications)) {
          notifications =
            await NotificationsHelper.requestToGetOnlyOneNotificationBeforeReceive(userVlad);
          await delay(100);
        }

        expect(notifications.length).toBe(1);

        const notification: any = notifications[0];

        expect(notification.event_id).toBe(EventsIdsDictionary.getUserCreatesDirectPostForOrg());

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkOneNotificationsFromList(notification, options);
      }, JEST_TIMEOUT);
    });
  });

  describe('User to user comments notifications', () => {
    it('User comments your post', async () => {
      const postAuthor = userVlad;
      const commentAuthor = userJane;

      const postId = await PostsGenerator.createMediaPostByUserHimself(postAuthor);
      await CommentsGenerator.createCommentForPost(postId, commentAuthor);

      let notifications = [];
      while (_.isEmpty(notifications)) {
        notifications =
          await NotificationsHelper.requestToGetOnlyOneNotificationBeforeReceive(userVlad);
        await delay(100);
      }

      expect(notifications.length).toBe(1);

      const notification: any = notifications[0];

      expect(notification.event_id).toBe(EventsIdsDictionary.getUserCommentsPost());

      const options = {
        postProcessing: 'notification',
      };

      CommonHelper.checkOneNotificationsFromList(notification, options);
    }, JEST_TIMEOUT);

    it('User creates comment on your comment', async () => {
      const postAuthor = userVlad;
      const commentAuthor = userJane;

      const commentOnCommentAuthor = userVlad;

      const postId = await PostsGenerator.createMediaPostByUserHimself(postAuthor);
      const newComment = await CommentsGenerator.createCommentForPost(postId, commentAuthor);

      await CommentsGenerator.createCommentOnComment(postId, newComment.id, commentOnCommentAuthor);

      let notification;

      while (!notification) {
        [notification] = await NotificationsHelper.requestToGetOnlyOneNotificationBeforeReceive(userJane);
        await delay(100);
      }

      const options = {
        postProcessing: 'notification',
      };

      CommonHelper.checkOneNotificationsFromList(notification, options);
    }, JEST_TIMEOUT);
  });

  describe('User voting activity', () => {
    describe('User to post activity', () => {
      it('user UPVOTES other user post', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        await PostsHelper.requestToUpvotePost(userJane, postId);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserUpvotesPostOfOtherUser(notification, options);
      });

      it('user DOWNVOTES other user post', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        await PostsHelper.requestToDownvotePost(userJane, postId);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserDownvotesPostOfOtherUser(notification, options);
      });

      it('user UPVOTES post of organization', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);
        await PostsHelper.requestToUpvotePost(userJane, postId);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserUpvotesPostOfOrg(notification, options);
      });

      it('user DOWNVOTES post of organization', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);
        await PostsHelper.requestToDownvotePost(userJane, postId);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserDownvotesPostOfOrg(notification, options);
      });
    });

    describe('User to post comment activity', () => {
      it('user UPVOTES other user comment', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        await CommentsHelper.requestToUpvoteComment(postId, comment.id, userJane);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserUpvotesCommentOfOtherUser(notification, options);
      });

      it('user DOWNVOTES other user comment', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        await CommentsHelper.requestToDownvoteComment(postId, comment.id, userJane);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserDownvotesCommentOfOtherUser(notification, options);
      }, JEST_TIMEOUT);

      it('user UPVOTES comment of organization', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);
        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        await CommentsHelper.requestToUpvoteComment(postId, comment.id, userJane);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserUpvotesCommentOfOrg(notification, options);
      });

      it('user DOWNVOTES comment of organization', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);
        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        await CommentsHelper.requestToDownvoteComment(postId, comment.id, userJane);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkUserDownvotesCommentOfOrg(notification, options);
      });
    });
  });

  describe('User to org content comments notifications', () => {
    describe('Positive', () => {
      it('User creates comment on organization comment', async () => {
        const orgAuthor = userVlad;
        const commentReplyAuthor = userJane;

        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(orgAuthor);
        const orgPostId = await PostsGenerator.createMediaPostOfOrganization(orgAuthor, orgId);

        const comment = await CommentsGenerator.createCommentForPost(orgPostId, orgAuthor);

        await CommentsGenerator.createCommentOnComment(orgPostId, comment.id, commentReplyAuthor);

        let notifications = [];
        while (_.isEmpty(notifications)) {
          notifications =
            await NotificationsHelper.requestToGetOnlyOneNotificationBeforeReceive(orgAuthor);
          await delay(100);
        }

        // Should not create notification when user creates comment on his own post. See above
        expect(notifications.length).toBe(1);

        const notification: any = notifications[0];

        expect(notification.event_id).toBe(EventsIdsDictionary.getUserCommentsOrgComment());

        CommonHelper.checkUserCommentsOrgCommentNotification(notification);
      }, JEST_TIMEOUT);

      it('User creates comment on organization post', async () => {
        const orgAuthor = userVlad;
        const commentAuthor = userJane;

        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(orgAuthor);
        const orgPostId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

        await CommentsGenerator.createCommentForPost(orgPostId, commentAuthor);

        let notification;

        while (!notification) {
          await delay(100);
          [notification] = await NotificationsHelper.requestToGetOnlyOneNotificationBeforeReceive(orgAuthor);
        }

        const options = {
          postProcessing: 'notification',
        };

        CommonHelper.checkOneNotificationsFromList(notification, options);
      }, JEST_TIMEOUT);

      it.skip('should not create notification if user comments his own post', async () => {
      });

      it.skip('Check exact user comments your post notification content', async () => {
      });
    });
  });

  describe('Organizations. Follow', () => {
    describe('Positive', () => {
      it('should create notification - somebody follows your organization', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        await OrganizationsHelper.requestToFollowOrganization(orgId, userJane);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);
        CommonHelper.checkUserFollowsOrgNotification(notification);
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
        await ActivityHelper.requestToCreateFollow(userJane, userVlad);
        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userVlad);

        CommonHelper.checkUserFollowsYouNotification(notification);
      });
    });

    describe('Users. Trust', () => {
      describe('Positive', () => {
        it('should create trust notification', async () => {
          await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id);
          const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userJane);

          CommonHelper.checkUserTrustsYouNotification(notification);
        }, JEST_TIMEOUT);
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

          const newOrgId = await OrganizationsGenerator.createOrgWithTeam(author, teamMembers);

          const janeNotification =
            await NotificationsHelper.requestToGetOnlyOneNotification(userJane);

          NotificationsHelper.checkUsersTeamInvitationPromptFromDb(
            janeNotification,
            userJane.id,
            newOrgId,
            true,
          );
          CommonHelper.checkOrgUsersTeamInvitationNotification(janeNotification);

          const petrNotifications =
            await NotificationsHelper.requestToGetNotificationsList(userPetr);
          // One notification for Petr - join invitation
          expect(petrNotifications.length).toBe(1);

          NotificationsHelper.checkUsersTeamInvitationPromptFromDb(
            petrNotifications[0],
            userPetr.id,
            newOrgId,
            true,
          );
          CommonHelper.checkOrgUsersTeamInvitationNotification(petrNotifications[0]);

          const rokkyNotifications =
            await NotificationsHelper.requestToGetNotificationsList(userRokky);
          // Rokky is not a team member so no notifications
          expect(_.isEmpty(rokkyNotifications)).toBeTruthy();

          const vladNotifications =
            await NotificationsHelper.requestToGetNotificationsList(userVlad);
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

          const newOrgId = await OrganizationsGenerator.createOrgWithTeam(author, teamMembers);

          const newTeamMembers: any[] = Array.prototype.concat(teamMembers, userRokky);

          await OrganizationsGenerator.updateOrganization(newOrgId, author, newTeamMembers);

          const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userRokky);

          NotificationsHelper.checkUsersTeamInvitationPromptFromDb(
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

          const newOrgId = await OrganizationsGenerator.createOrgWithTeam(author, teamMembers);

          const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userJane);
          const confirmed =
            await NotificationsHelper.requestToConfirmPrompt(userJane, notification.id);

          const options = {
            myselfData: true,
          };

          CommonHelper.checkOneNotificationsFromList(confirmed, options);

          NotificationsHelper.checkUsersTeamInvitationPromptFromDb(
            confirmed,
            userJane.id,
            newOrgId,
            false,
            'confirmed',
          );

          // get organizations board and see that status is confirmed

          const org = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(newOrgId);

          const usersTeam = org.users_team;

          const userJaneMember = usersTeam.find((data) => data.id === userJane.id);
          expect(userJaneMember.users_team_status)
            .toBe(UsersTeamStatusDictionary.getStatusConfirmed());
        }, 10000);

        it('should properly DECLINE users team invitation prompt', async () => {
          const author = userVlad;

          const teamMembers = [
            userJane,
            userPetr,
          ];

          const newOrgId = await OrganizationsGenerator.createOrgWithTeam(author, teamMembers);

          const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userPetr);
          const declined =
            await NotificationsHelper.requestToDeclinePrompt(userPetr, notification.id);

          const options = {
            myselfData: true,
          };

          CommonHelper.checkOneNotificationsFromList(declined, options);

          NotificationsHelper.checkUsersTeamInvitationPromptFromDb(
            declined,
            userPetr.id,
            newOrgId,
            false,
            'declined',
          );

          // get organizations board and see that status is confirmed

          const usersTeam = await UsersTeamRepository.findAllRelatedToEntity(
            OrganizationsModelProvider.getEntityName(),
            newOrgId,
          );

          const userPetrMember = usersTeam.find((data) => data.user_id === userPetr.id);
          expect(userPetrMember.status).toBe(UsersTeamStatusDictionary.getStatusDeclined());
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

          const newOrgId = await OrganizationsGenerator.createOrgWithTeam(author, teamMembers);

          const org = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(newOrgId);

          const usersTeam = org.users_team;

          usersTeam.forEach((member) => {
            expect(member.users_team_status).toBeDefined();
            expect(member.users_team_status).toBe(UsersTeamStatusDictionary.getStatusPending());
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

        await OrganizationsGenerator.createOrgWithTeam(author, teamMembers);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userJane);

        const seen =
          await NotificationsHelper.requestToMarkNotificationSeen(userJane, notification.id);

        const options = {
          myselfData: true,
        };

        CommonHelper.checkOneNotificationsFromList(seen, options);

        await NotificationsHelper.checkPromptNotificationIsSeenButNotFinished(seen);
      });

      it('mark alert notification as seen. Should be finished', async () => {
        await ActivityHelper.requestToCreateFollow(userVlad, userJane);

        const notification = await NotificationsHelper.requestToGetOnlyOneNotification(userJane);

        const seen =
          await NotificationsHelper.requestToMarkNotificationSeen(userJane, notification.id);

        const options = {
          myselfData: true,
        };

        CommonHelper.checkOneNotificationsFromList(seen, options);

        await NotificationsHelper.checkAlertNotificationIsSeen(seen);
      });
    });

    // tslint:disable-next-line:max-line-length
    it.skip('should properly count unread_messages_count after seen or prompt answer actions', async () => {
    });
  });
});

export {};
