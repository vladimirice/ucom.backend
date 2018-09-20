const request = require('supertest');
const server = require('../../../app');
const helpers = require('../helpers');

const UserHelper = require('../helpers/users-helper');

const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityUserUserRepository = require('../../../lib/users/activity-user-user-repository');
const ActivityDictionary = require('../../../lib/activity/activity-types-dictionary');
const ActivityHelper = require('../helpers/activity-helper');
const BlockchainStatusDictionary = require('../../../lib/eos/eos-blockchain-status-dictionary');
const PostRepository = require('../../../lib/posts/posts-repository');

require('jest-expect-message');

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('User to user activity', () => {
  beforeAll(async () => { await helpers.SeedsHelper.destroyTables(); });

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

  describe('Follow workflow', () => {
    describe('Follow Positive scenarios', () => {
      it('Vlad follows Jane', async () => {

        await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);

        const activity = await ActivityUserUserRepository.getLastFollowActivityForUser(userVlad.id, userJane.id);
        expect(activity).not.toBeNull();

        expect(activity.user_id_from).toBe(userVlad.id);
        expect(activity.user_id_to).toBe(userJane.id);
        expect(activity.activity_type_id).toBe(ActivityDictionary.getFollowId());

        // TODO - blockchain
        expect(+activity.blockchain_status).toBe(BlockchainStatusDictionary.getNotRequiredToSend());
      })
    });

    describe('Follow Negative scenarios', () => {
      it('should not be possible to follow yourself', async () => {
        const res = await request(server)
          .post(RequestHelper.getFollowUrl(userVlad.id))
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });

      it('should not be possible to follow twice', async () => {
        const whoActs = userVlad;
        const targetUser = userJane;

        await helpers.ActivityHelper.requestToCreateFollow(whoActs, targetUser);

        const res = await request(server)
          .post(helpers.RequestHelper.getFollowUrl(targetUser.id))
          .set('Authorization', `Bearer ${whoActs.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
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
        await helpers.ActivityHelper.requestToCreateFollow(userVlad, userJane);

        await helpers.ActivityHelper.requestToCreateUnfollow(userVlad, userJane);

        const activity = await ActivityUserUserRepository.getLastUnfollowActivityForUser(userVlad.id, userJane.id);
        expect(activity).not.toBeNull();

        expect(activity.user_id_from).toBe(userVlad.id);
        expect(activity.user_id_to).toBe(userJane.id);
        expect(activity.activity_type_id).toBe(ActivityDictionary.getUnfollowId());
      }, 30000);

      it('should allow to create follow record after follow-unfollow workflow', async () => {
        await ActivityHelper.requestToCreateFollow(userVlad, userPetr);
        await ActivityHelper.requestToCreateUnfollow(userVlad, userPetr);
        await ActivityHelper.requestToCreateFollow(userVlad, userPetr);
      }, 50000);
    });

    describe('Negative scenarios', () => {
      it('should not be possible to unfollow yourself', async () => {
        const res = await request(server)
          .post(RequestHelper.getUnfollowUrl(userVlad.id))
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });

      it('should not be possible to unfollow user you do not follow', async () => {
        await helpers.SeedsHelper.truncateTable('activity_user_user');

        const res = await request(server)
          .post(RequestHelper.getUnfollowUrl(userJane.id))
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });

      it('should not be possible to unfollow twice', async () => {
        const whoActs = userVlad;
        const targetUser = userJane;

        await helpers.ActivityHelper.requestToCreateFollow(whoActs, targetUser);
        await helpers.ActivityHelper.requestToCreateUnfollow(whoActs, targetUser);

        const res = await request(server)
          .post(RequestHelper.getUnfollowUrl(targetUser.id))
          .set('Authorization', `Bearer ${whoActs.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      }, 30000);

      it('should not be possible to follow without token', async () => {
        const res = await request(server)
          .post(helpers.RequestHelper.getUnfollowUrl(userJane.id))
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('User list. MyselfData', () => {
    it('MyselfData. User list must contain myselfData with actual follow status', async () => {

      await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
      await ActivityHelper.requestToCreateUnfollow(userPetr, userVlad);


      await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
      await ActivityHelper.requestToCreateFollow(userPetr, userJane);
      await ActivityHelper.requestToCreateFollow(userJane, userPetr);

      const users = await UserHelper.requestUserListByMyself(userPetr);

      const responseVlad = users.find(data => data.id === userVlad.id);
      expect(responseVlad.myselfData.follow).toBeTruthy();

      const responseJane = users.find(data => data.id === userJane.id);
      expect(responseJane.myselfData.follow).toBeTruthy();
      expect(responseJane.myselfData.myFollower).toBeTruthy();

      const responseRokky = users.find(data => data.id === userRokky.id);
      expect(responseRokky.myselfData).toBeDefined();
      expect(responseRokky.myselfData.follow).toBeFalsy();
    }, 50000);
    it('MyselfData. There is no myself data if user is not logged in', async () => {
      await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
      await ActivityHelper.requestToCreateFollow(userPetr, userJane);

      const users = await UserHelper.requestUserListAsGuest();

      const userWithMyself = users.some(user => user.myselfData !== undefined);

      expect(userWithMyself).toBeFalsy();
    }, 30000);
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

      await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
      await ActivityHelper.requestToCreateFollow(userPetr, userRokky);

      await ActivityHelper.requestToCreateFollow(userJane, userPetr);
      await ActivityHelper.requestToCreateUnfollow(userJane, userPetr);
      await ActivityHelper.requestToCreateFollow(userJane, userPetr);
      await ActivityHelper.requestToCreateFollow(userVlad, userPetr);

      const janeSampleRate = await UserHelper.setSampleRateToUser(userJane);
      const userRokkySampleRate = await UserHelper.setSampleRateToUser(userRokky);
      const user = await RequestHelper.requestUserByIdAsGuest(userPetr);

      const followedBy = user['followed_by'];
      expect(followedBy).toBeDefined();
      followedByExpected.forEach(user => {
        expect(followedBy.some(data => data.id === user.id)).toBeTruthy();
      });

      const iFollow = user['I_follow'];
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
    }, 50000);
    it('I_follow and followed_by of single user - does not exist', async () => {
      const user = await RequestHelper.requestUserByIdAsGuest(userPetr);

      const followedBy = user['followed_by'];
      expect(followedBy).toBeDefined();
      expect(followedBy.length).toBe(0);

      const iFollow = user['I_follow'];
      expect(iFollow).toBeDefined();
      expect(iFollow.length).toBe(0);
    });

    it('MyselfData exists.', async () => {
      await helpers.ActivityHelper.requestToCreateFollowHistory(userJane, userPetr);
      const user = await RequestHelper.requestUserByIdAsMyself(userJane, userPetr);

      expect(user.myselfData).toBeDefined();
      expect(user.myselfData.follow).toBeTruthy();
      expect(user.myselfData.myFollower).toBeFalsy();
    }, 50000);

    it('MyselfData. Does not exist if no token', async () => {
      await helpers.ActivityHelper.requestToCreateFollowHistory(userJane, userPetr);
      const user = await RequestHelper.requestUserByIdAsGuest(userPetr);

      expect(user.myselfData).not.toBeDefined();
    }, 50000);
  });

  describe('Post author myself activity', () => {
    it('Myself data in post User info - following', async () => {
      await ActivityHelper.requestToCreateFollow(userVlad, userJane);

      const postId = await PostRepository.findLastMediaPostIdByAuthor(userJane.id);

      const body = await helpers.PostHelper.requestToGetOnePostAsMyself(postId, userVlad);

      const author = body.User;
      expect(author).toBeDefined();

      expect(author.myselfData).toBeDefined();
      expect(author.myselfData.follow).toBeDefined();
      expect(author.myselfData.follow).toBeTruthy();
    });

    it('Myself data in post User info - not following', async () => {

      const postId = await PostRepository.findLastMediaPostIdByAuthor(userVlad.id);

      const body = await helpers.PostHelper.requestToGetOnePostAsMyself(postId, userVlad);

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