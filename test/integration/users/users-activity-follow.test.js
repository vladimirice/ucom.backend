const request = require('supertest');
const server = require('../../../app');
const helpers = require('../helpers');

const UserHelper = require('../helpers/users-helper');

const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityHelper = require('../helpers/activity-helper');
const PostRepository = require('../../../lib/posts/posts-repository');
const UsersActivityRepository = require('../../../lib/users/repository').Activity;

require('jest-expect-message');

let userVlad,  userJane, userPetr, userRokky;

helpers.Mock.mockUsersActivityBackendSigner();
helpers.Mock.mockBlockchainPart();

describe('User to user activity', () => {
  beforeAll(async () => { await helpers.SeedsHelper.beforeAllRoutine(); });

  beforeEach(async () => {
    await helpers.SeedsHelper.initSeedsForUsers();

    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr, userRokky] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane(),
      UserHelper.getUserPetr(),
      UserHelper.getUserRokky(),
    ]);
  });

  afterAll(async () => { await helpers.SeedsHelper.sequelizeAfterAll(); });


  describe('Follow and unfollow activity itself', function () {
    describe('Follow workflow', () => {
      describe('Follow Positive scenarios', () => {
        it('Vlad follows Jane - should create correct activity record', async () => {
          await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);

          const activity = await UsersActivityRepository.getLastFollowActivityForUser(userVlad.id, userJane.id);
          expect(activity).not.toBeNull();
        });

        it('should be possible to follow having follow history', async () => {
          await helpers.ActivityHelper.requestToCreateUnfollowHistory(userVlad, userJane);

          await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);
        });
      });

      describe('Follow Negative scenarios', () => {
        it('should not be possible to follow yourself', async () => {
          await helpers.ActivityHelper.requestToCreateFollow(userVlad, userVlad, 400);
        });

        it('should not be possible to follow twice', async () => {
          const whoActs   = userVlad;
          const targetUser = userJane;

          await helpers.ActivityHelper.requestToCreateFollow(whoActs, targetUser);
          await helpers.ActivityHelper.requestToCreateFollow(whoActs, targetUser, 400);
        });

        it('should not be possible to follow twice having follow history', async () => {
          const whoActs   = userVlad;
          const targetUser = userJane;

          await helpers.ActivityHelper.requestToCreateFollowHistory(whoActs, targetUser);
          await helpers.ActivityHelper.requestToCreateFollow(whoActs, targetUser, 400);
        });

        it('should not be possible to follow without token', async () => {
          const res = await request(server)
            .post(helpers.RequestHelper.getFollowUrl(userJane.id))
          ;

          ResponseHelper.expectStatusUnauthorized(res);
        });
      })
    });
    describe('Unfollow workflow', () => {
      describe('Positive scenarios', () => {
        it('should create correct activity record in DB', async () => {
          await helpers.ActivityHelper.requestToCreateUnfollowHistory(userVlad, userJane);

          const activity = await UsersActivityRepository.getLastUnfollowActivityForUser(userVlad.id, userJane.id);
          expect(activity).not.toBeNull();
          expect(activity.id).toBeTruthy();
        });

        it('should allow to create Unfollow record after follow-unfollow workflow', async () => {
          await helpers.ActivityHelper.requestToCreateFollowHistory(userVlad, userPetr);

          await helpers.ActivityHelper.requestToCreateUnfollow(userVlad, userPetr);
        });
      });

      describe('Negative scenarios', () => {
        it('should not be possible to unfollow twice', async () => {
          const whoActs = userVlad;
          const targetUser = userJane;

          await helpers.ActivityHelper.requestToCreateFollow(whoActs, targetUser);
          await helpers.ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);

          await helpers.ActivityHelper.requestToCreateUnfollow(whoActs, targetUser, 400);
        });

        it('should not be possible to UNfollow twice having UNfollow history', async () => {
          const whoActs = userVlad;
          const targetUser = userJane;

          await helpers.ActivityHelper.requestToCreateUnfollowHistory(whoActs, targetUser);
          await helpers.ActivityHelper.requestToCreateUnfollow(whoActs, targetUser, 400);
        });

        it('should not be possible to unfollow yourself', async () => {
          await helpers.ActivityHelper.requestToCreateUnfollow(userVlad, userVlad, 400);
        });

        it('should not be possible to unfollow user you do not follow', async () => {
          await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane); // to disturb somehow

          await helpers.ActivityHelper.requestToCreateUnfollow(userVlad, userPetr, 400);
        });

        it('should not be possible to follow without token', async () => {
          const res = await request(server)
            .post(helpers.RequestHelper.getUnfollowUrl(userJane.id))
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
        ActivityHelper.requestToCreateFollow(userJane, userPetr)
      ]);

      const users = await UserHelper.requestUserListByMyself(userPetr);

      const responseVlad = users.find(data => data.id === userVlad.id);
      expect(responseVlad.myselfData.follow).toBeTruthy();

      const responseJane = users.find(data => data.id === userJane.id);
      expect(responseJane.myselfData.follow).toBeTruthy();
      expect(responseJane.myselfData.myFollower).toBeTruthy();

      const responseRokky = users.find(data => data.id === userRokky.id);
      expect(responseRokky.myselfData).toBeDefined();
      expect(responseRokky.myselfData.follow).toBeFalsy();
    });

    describe('Negative scenarios', () => {
      it('MyselfData. There is no myself data if user is not logged in', async () => {

        await Promise.all([
          ActivityHelper.requestToCreateFollow(userPetr, userVlad),
          ActivityHelper.requestToCreateFollow(userPetr, userJane)
        ]);

        const queryString = '?v2=true';
        const users = await UserHelper.requestUserListAsGuest(queryString);

        const userWithMyself = users.some(user => user.myselfData !== undefined);

        expect(userWithMyself).toBeFalsy();
      });
    });
  });

  describe('Single user. I_follow, followed_by and myselfData', () => {
    it('I_follow and followed_by of single user - exists', async () => {
      const IFollowExpected = [
        userVlad,
        userRokky
      ];

      const followedByExpected = [
        userJane,
        userVlad
      ];

      await ActivityHelper.requestToCreateFollowHistory(userPetr, userVlad);
      await ActivityHelper.requestToCreateFollowHistory(userPetr, userRokky);
      await ActivityHelper.requestToCreateFollowHistory(userJane, userPetr);
      await ActivityHelper.requestToCreateFollowHistory(userVlad, userPetr);

      const janeSampleRate = await UserHelper.setSampleRateToUser(userJane);
      const userRokkySampleRate = await UserHelper.setSampleRateToUser(userRokky);
      const user = await RequestHelper.requestUserByIdAsGuest(userPetr);

      const followedBy = user.followed_by;
      expect(followedBy).toBeDefined();
      followedByExpected.forEach(user => {
        expect(followedBy.some(data => data.id === user.id)).toBeTruthy();
      });

      const iFollow = user.I_follow;
      expect(iFollow).toBeDefined();
      IFollowExpected.forEach(user => {
        expect(iFollow.some(data => data.id === user.id)).toBeTruthy();
      });

      followedBy.forEach(follower => {
        UserHelper.checkIncludedUserPreview({
          'User': follower
        });
      });

      const userJaneResponse = followedBy.find(data => data.id === userJane.id);
      expect(+userJaneResponse.current_rate).toBe(+janeSampleRate);

      const userRokkyResponse = iFollow.find(data => data.id === userRokky.id);
      expect(+userRokkyResponse.current_rate).toBe(+userRokkySampleRate);
    });

    it('I_follow and followed_by of single user - does not exist', async () => {
      const user = await helpers.Req.requestUserByIdAsGuest(userPetr);

      const followedBy = user.followed_by;
      expect(followedBy).toBeDefined();
      expect(followedBy.length).toBe(0);

      const iFollow = user.I_follow;
      expect(iFollow).toBeDefined();
      expect(iFollow.length).toBe(0);
    });

    it('Myself - I follow but not my follower', async () => {

      await Promise.all([
        helpers.ActivityHelper.requestToCreateFollowHistory(userJane, userPetr),
        helpers.ActivityHelper.requestToCreateUnfollowHistory(userPetr, userJane),  // disturbance
        helpers.ActivityHelper.requestToCreateFollowHistory(userPetr, userVlad)  // disturbance
      ]);

      const user = await helpers.Req.requestUserByIdAsMyself(userJane, userPetr);

      const myselfData = user.myselfData;

      expect(myselfData).toBeDefined();
      expect(myselfData.follow).toBeTruthy();
      expect(myselfData.myFollower).toBeFalsy();
    });

    it('Myself - My follower but I do not follow', async () => {

      await Promise.all([
        helpers.ActivityHelper.requestToCreateFollowHistory(userPetr, userJane),
        helpers.ActivityHelper.requestToCreateUnfollowHistory(userJane, userPetr),  // disturbance
        helpers.ActivityHelper.requestToCreateFollowHistory(userJane, userVlad) // disturbance
      ]);

      const user = await helpers.Req.requestUserByIdAsMyself(userJane, userPetr);

      const myselfData = user.myselfData;

      expect(myselfData).toBeDefined();
      expect(myselfData.follow).toBeFalsy();
      expect(myselfData.myFollower).toBeTruthy();
    });

    it('Myself both follow and my follower', async () => {

      await Promise.all([
        helpers.ActivityHelper.requestToCreateFollowHistory(userJane, userPetr),
        helpers.ActivityHelper.requestToCreateFollowHistory(userPetr, userJane),
        helpers.ActivityHelper.requestToCreateUnfollowHistory(userVlad, userJane) // disturbance
      ]);

      const user = await helpers.Req.requestUserByIdAsMyself(userJane, userPetr);

      const myselfData = user.myselfData;

      expect(myselfData).toBeDefined();
      expect(myselfData.follow).toBeTruthy();
      expect(myselfData.myFollower).toBeTruthy();
    });

    it('MyselfData. Does not exist if no token', async () => {
      await helpers.ActivityHelper.requestToCreateFollowHistory(userJane, userPetr);
      const user = await RequestHelper.requestUserByIdAsGuest(userPetr);

      expect(user.myselfData).not.toBeDefined();
    });
  });

  describe('Post author myself activity', () => {
    it('Myself data in post User info - following', async () => {

      await Promise.all([
        ActivityHelper.requestToCreateFollowHistory(userVlad, userJane),
        ActivityHelper.requestToCreateUnfollowHistory(userVlad, userPetr) // disturb
      ]);

      const postId = await PostRepository.findLastMediaPostIdByAuthor(userJane.id);

      const body = await helpers.PostHelper.requestToGetOnePostAsMyself(postId, userVlad);

      const author = body.User;
      expect(author).toBeDefined();

      expect(author.myselfData).toBeDefined();
      expect(author.myselfData.follow).toBeTruthy();
    });

    it('Myself data in post User info - not following', async () => {
      const [ postId ] = await Promise.all([
        PostRepository.findLastMediaPostIdByAuthor(userVlad.id),
        helpers.ActivityHelper.requestToCreateUnfollowHistory(userJane, userVlad)
      ]);

      const body = await helpers.PostHelper.requestToGetOnePostAsMyself(postId, userJane);

      const author = body.User;

      expect(author).toBeDefined();

      expect(author.myselfData).toBeDefined();
      expect(author.myselfData.follow).toBeDefined();
      expect(author.myselfData.follow).toBeFalsy();
    });
  });

  describe('General negative scenarios', async () => {
    it('Not possible to follow user which does not exist', async () => {
      // noinspection MagicNumberJS
      const res = await request(server)
        .post(RequestHelper.getFollowUrl(100500))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to follow user if userId is malformed', async () => {
      const res = await request(server)
        .post(RequestHelper.getFollowUrl('invalidID'))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusBadRequest(res);
    });
  });
});