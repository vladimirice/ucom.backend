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
        expect(+activity.blockchain_status).toBe(BlockchainStatusDictionary.getNotRequiredToSend());
      });

      it('should allow to create follow record after follow-unfollow workflow', async () => {
        await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
        await ActivityHelper.requestToCreateUnfollow(userPetr, userVlad);
        await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
      });

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
      });

      it('should not be possible to follow without token', async () => {
        const res = await request(server)
          .post(helpers.RequestHelper.getUnfollowUrl(userJane.id))
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('User followers and I_follow and myself data', () => {
      describe('User-to-user myself data inside lists', () => {
        it('User list must contain myselfData with actual follow status', async () => {


          await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
          await ActivityHelper.requestToCreateUnfollow(userPetr, userVlad);
          await ActivityHelper.requestToCreateFollow(userPetr, userVlad);


          const users = await UserHelper.requestUserListByMyself(userPetr);

          const responseVlad = users.find(data => data.id === userVlad.id);
          expect(responseVlad.myselfData).toBeDefined();
          expect(responseVlad.myselfData.follow).toBeTruthy();

          const responseJane = users.find(data => data.id === userJane.id);
          expect(responseJane.myselfData).toBeDefined();
          expect(responseJane.myselfData.follow).toBeTruthy();

          const responseRokky = users.find(data => data.id === userRokky.id);
          expect(responseRokky.myselfData).toBeDefined();
          expect(responseRokky.myselfData.follow).toBeFalsy();
        });

        it('There is no myself data if user is not logged in', async () => {
          await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
          await ActivityHelper.requestToCreateFollow(userPetr, userJane);

          const users = await UserHelper.requestUserListAsGuest();

          users.forEach(user => {
            expect(user.myselfData).not.toBeDefined();
          });
        });

      });

      it('Get user info with his followers', async () => {
        await ActivityHelper.requestToCreateFollow(userJane, userVlad);
        await ActivityHelper.requestToCreateFollow(userPetr, userVlad);

        await ActivityHelper.requestToCreateFollow(userVlad, userRokky);
        await ActivityHelper.requestToCreateFollow(userVlad, userJane);

        const janeSampleRate = await UserHelper.setSampleRateToUser(userJane);
        const user = await RequestHelper.requestUserById(userVlad.id);

        const followedBy = user['followed_by'];
        expect(followedBy).toBeDefined();
        expect(followedBy.length).toBeGreaterThan(0);

        const iFollow = user['I_follow'];
        expect(iFollow).toBeDefined();
        expect(iFollow.length).toBeGreaterThan(0);

        followedBy.forEach(follower => {
          UserHelper.checkIncludedUserPreview({
            'User': follower
          });
        });

        const userJaneResponse = followedBy.find(data => data.id === userJane.id);
        expect(+userJaneResponse.current_rate).toBe(+janeSampleRate);

        const userJaneFromIFollow = iFollow.find(data => data.id === userJane.id);
        expect(+userJaneFromIFollow.current_rate).toBe(+janeSampleRate);
      });

      it('Get user info with I_follow', async () => {
        await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
        await ActivityHelper.requestToCreateFollow(userPetr, userJane);
        const user = await RequestHelper.requestUserById(userPetr.id);

        const iFollow = user['I_follow'];
        expect(iFollow).toBeDefined();
        expect(iFollow.length).toBeGreaterThan(0);

        iFollow.forEach(follower => {
          UserHelper.checkIncludedUserPreview({
            'User': follower
          });
        });
      });

      it('There is no followers of user', async () => {
        const user = await RequestHelper.requestUserById(userPetr.id);

        const followedBy = user['followed_by'];
        expect(followedBy).toBeDefined();
        expect(followedBy.length).toBe(0);
      });

      it('There is no I_follow of user', async () => {
        const user = await RequestHelper.requestUserById(userPetr.id);

        const iFollow = user['I_follow'];
        expect(iFollow).toBeDefined();
        expect(iFollow.length).toBe(0);
      });


      it('Get myself info with his followers', async () => {
        await ActivityHelper.requestToCreateFollow(userJane, userPetr);
        await ActivityHelper.requestToCreateFollow(userVlad, userPetr);

        const user = await RequestHelper.requestMyself(userPetr);

        const followedBy = user['followed_by'];
        expect(followedBy).toBeDefined();
        expect(followedBy.length).toBeGreaterThan(0);

        followedBy.forEach(follower => {
          UserHelper.checkIncludedUserPreview({
            'User': follower
          });
        });
      });

      it('Get myself info with I_follow', async () => {
        await ActivityHelper.requestToCreateFollow(userPetr, userVlad);
        await ActivityHelper.requestToCreateFollow(userPetr, userJane);
        const user = await RequestHelper.requestMyself(userPetr);

        const iFollow = user['I_follow'];
        expect(iFollow).toBeDefined();
        expect(iFollow.length).toBeGreaterThan(0);

        iFollow.forEach(follower => {
          UserHelper.checkIncludedUserPreview({
            'User': follower
          });
        });
      });

      it('There is no I_follow of myself', async () => {
        const user = await RequestHelper.requestMyself(userPetr);

        const iFollow = user['I_follow'];
        expect(iFollow).toBeDefined();
        expect(iFollow.length).toBe(0);
      });

      it('There is no followers of myself', async () => {
        const user = await RequestHelper.requestMyself(userPetr);

        const followedBy = user['followed_by'];
        expect(followedBy).toBeDefined();
        expect(followedBy.length).toBe(0);
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