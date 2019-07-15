import MockHelper = require('../../../helpers/mock-helper');

const request = require('supertest');

import UsersActivityRepository = require('../../../../../lib/users/repository/users-activity-repository');
import RequestHelper = require('../../../helpers/request-helper');

import ActivityHelper = require('../../../helpers/activity-helper');
import SeedsHelper = require('../../../helpers/seeds-helper');
import PostsHelper = require('../../../helpers/posts-helper');
import ResponseHelper = require('../../../helpers/response-helper');
import UsersHelper = require('../../../helpers/users-helper');
import PostsRepository = require('../../../../../lib/posts/posts-repository');
import CommonChecker = require('../../../../helpers/common/common-checker');
import UsersActivityFollowRepository = require('../../../../../lib/users/repository/users-activity/users-activity-follow-repository');
// @ts-ignore
const server = RequestHelper.getApiApplication();

require('jest-expect-message');

let userVlad;
let userJane;
let userPetr;
let userRokky;

MockHelper.mockAllBlockchainPart();

const JEST_TIMEOUT = 5000;

describe('User to user activity', () => {
  beforeAll(async () => { await SeedsHelper.noGraphQlMockAllWorkers(); });

  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();

    await SeedsHelper.seedOrganizations();
    await SeedsHelper.seedPosts();
  });

  afterAll(async () => { await SeedsHelper.sequelizeAfterAll(); });

  describe('Users activity follow index table', () => {
    it('users activity follow index record is created and then deleted after unfollow activity', async () => {
      await ActivityHelper.requestToCreateFollowHistory(userVlad, userJane);
      const followRecord = await UsersActivityFollowRepository.getUserFollowsOtherUser(userVlad.id, userJane.id);

      CommonChecker.expectNotEmpty(followRecord);
      await ActivityHelper.requestToCreateUnfollow(userVlad, userJane);

      const nullableRecord = await UsersActivityFollowRepository.getUserFollowsOtherUser(userVlad.id, userJane.id);

      expect(nullableRecord).toBe(null);
    });
  });

  describe('Follow and unfollow activity itself', () => {
    describe('Follow workflow', () => {
      describe('Follow Positive scenarios', () => {
        it('Vlad follows Jane - should create correct activity record', async () => {
          await ActivityHelper.requestToCreateFollow(userVlad, userJane);

          const activity =
            await UsersActivityRepository.getLastFollowActivityForUser(userVlad.id, userJane.id);

          CommonChecker.expectNotEmpty(activity);
        });

        it('should be possible to follow having follow history', async () => {
          await ActivityHelper.requestToCreateUnfollowHistory(userVlad, userJane);

          await ActivityHelper.requestToCreateFollow(userVlad, userJane);
        }, JEST_TIMEOUT);
      });

      describe('Follow Negative scenarios', () => {
        it('should not be possible to follow yourself', async () => {
          await ActivityHelper.requestToCreateFollow(userVlad, userVlad, 400);
        });

        it('should not be possible to follow twice', async () => {
          const whoActs   = userVlad;
          const targetUser = userJane;

          await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
          await ActivityHelper.requestToCreateFollow(whoActs, targetUser, 400);
        }, JEST_TIMEOUT);

        it('should not be possible to follow twice having follow history', async () => {
          const whoActs   = userVlad;
          const targetUser = userJane;

          await ActivityHelper.requestToCreateFollowHistory(whoActs, targetUser);
          await ActivityHelper.requestToCreateFollow(whoActs, targetUser, 400);
        }, JEST_TIMEOUT);

        it('should not be possible to follow without token', async () => {
          const res = await request(server)
            .post(RequestHelper.getFollowUrl(userJane.id))
          ;

          ResponseHelper.expectStatusUnauthorized(res);
        }, JEST_TIMEOUT);
      });
    });
    describe('Unfollow workflow', () => {
      describe('Positive scenarios', () => {
        it('should create correct activity record in DB', async () => {
          await ActivityHelper.requestToCreateUnfollowHistory(userVlad, userJane);

          const activity =
            await UsersActivityRepository.getLastUnfollowActivityForUser(userVlad.id, userJane.id);
          expect(activity).not.toBeNull();
          expect(activity.id).toBeTruthy();
        }, JEST_TIMEOUT);

        it('should allow to create Unfollow record after follow-unfollow workflow', async () => {
          await ActivityHelper.requestToCreateFollowHistory(userVlad, userPetr);

          await ActivityHelper.requestToCreateUnfollow(userVlad, userPetr);
        }, JEST_TIMEOUT);
      });

      describe('Negative scenarios', () => {
        it('should not be possible to unfollow twice', async () => {
          const whoActs = userVlad;
          const targetUser = userJane;

          await ActivityHelper.requestToCreateFollow(whoActs, targetUser);
          await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);

          await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser, 400);
        }, JEST_TIMEOUT);

        it('should not be possible to UNfollow twice having UNfollow history', async () => {
          const whoActs = userVlad;
          const targetUser = userJane;

          await ActivityHelper.requestToCreateUnfollowHistory(whoActs, targetUser);
          await ActivityHelper.requestToCreateUnfollow(whoActs, targetUser, 400);
        }, JEST_TIMEOUT);

        it('should not be possible to unfollow yourself', async () => {
          await ActivityHelper.requestToCreateUnfollow(userVlad, userVlad, 400);
        }, JEST_TIMEOUT);

        it('should not be possible to unfollow user you do not follow', async () => {
          await ActivityHelper.requestToCreateFollow(
            userVlad,
            userJane,
          ); // to disturb somehow

          await ActivityHelper.requestToCreateUnfollow(userVlad, userPetr, 400);
        });

        it('should not be possible to follow without token', async () => {
          const res = await request(server)
            .post(RequestHelper.getUnfollowUrl(userJane.id))
          ;

          ResponseHelper.expectStatusUnauthorized(res);
        });
      });
    });
  });

  describe('User list. MyselfData', () => {
    it('MyselfData. User list must contain myselfData with actual follow status', async () => {
      await ActivityHelper.requestToCreateFollowHistory(userPetr, userVlad);

      await Promise.all([
        ActivityHelper.requestToCreateFollow(userPetr, userJane),
        ActivityHelper.requestToCreateFollow(userJane, userPetr),
      ]);

      const usersResponse = await UsersHelper.requestUserListByMyself(userPetr);
      const users = usersResponse.data;

      const responseVlad = users.find(data => data.id === userVlad.id);
      expect(responseVlad.myselfData.follow).toBeTruthy();

      const responseJane = users.find(data => data.id === userJane.id);
      expect(responseJane.myselfData.follow).toBeTruthy();
      expect(responseJane.myselfData.myFollower).toBeTruthy();

      const responseRokky = users.find(data => data.id === userRokky.id);
      expect(responseRokky.myselfData).toBeDefined();
      expect(responseRokky.myselfData.follow).toBeFalsy();
    }, JEST_TIMEOUT);

    describe('Negative scenarios', () => {
      it('MyselfData. There is no myself data if user is not logged in', async () => {
        await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
        await ActivityHelper.requestToCreateFollow(userPetr, userJane);

        const users = await UsersHelper.requestUserListAsGuest();

        const userWithMyself = users.some(user => user.myselfData !== undefined);

        expect(userWithMyself).toBeFalsy();
      }, JEST_TIMEOUT);
    });
  });

  describe('Post author myself activity', () => {
    it('Myself data in post User info - following', async () => {
      await ActivityHelper.requestToCreateFollowHistory(userVlad, userJane);
      await ActivityHelper.requestToCreateUnfollowHistory(userVlad, userPetr); // disturb

      const postId = await PostsRepository.findLastMediaPostIdByAuthor(userJane.id);

      const body = await PostsHelper.requestToGetOnePostAsMyself(postId, userVlad);

      const author = body.User;
      expect(author).toBeDefined();

      expect(author.myselfData).toBeDefined();
      expect(author.myselfData.follow).toBeTruthy();
    });

    it('Myself data in post User info - not following', async () => {
      const [postId] = await Promise.all([
        PostsRepository.findLastMediaPostIdByAuthor(userVlad.id),
        ActivityHelper.requestToCreateUnfollowHistory(userJane, userVlad),
      ]);

      const body = await PostsHelper.requestToGetOnePostAsMyself(postId, userJane);

      const author = body.User;

      expect(author).toBeDefined();

      expect(author.myselfData).toBeDefined();
      expect(author.myselfData.follow).toBeDefined();
      expect(author.myselfData.follow).toBeFalsy();
    }, JEST_TIMEOUT);
  });

  describe('General negative scenarios', () => {
    it('Not possible to follow user which does not exist', async () => {
      // noinspection MagicNumberJS
      const res = await request(server)
        .post(RequestHelper.getFollowUrl(100500))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    }, JEST_TIMEOUT);

    it('Not possible to follow user if userId is malformed', async () => {
      const res = await request(server)
        .post(RequestHelper.getFollowUrl('invalidID'))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    });
  });
});

export {};
