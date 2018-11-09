const helpers = require('../helpers');
const UserActivityRepository = require('../../../lib/users/repository').Activity;

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('User follows-unfollows organizations. Without transaction checking.', () => {
  beforeAll(async ()  => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async ()   => { await helpers.SeedsHelper.sequelizeAfterAll(); });
  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Single organization. Follow inside myselfData', () => {
    it('MyselfData contains follow', async () => {
      const orgId = 1;
      const user = userRokky;

      await helpers.Org.requestToCreateOrgFollowHistory(user, orgId);
      const org = await helpers.Org.requestToGetOneOrganizationAsMyself(user, orgId);

      expect(org.myselfData).toBeDefined();
      expect(org.myselfData.follow).toBeTruthy();
    });

    it('MyselfData contains follow false', async () => {
      const orgId = 1;
      const otherOrgId = 2;
      const user = userRokky;

      // In order to disturb conditions somehow
      await helpers.Org.requestToCreateOrgFollowHistory(userJane, orgId);
      await helpers.Org.requestToCreateOrgFollowHistory(userVlad, orgId);

      await helpers.Org.requestToCreateOrgFollowHistory(user, otherOrgId);
      await helpers.Org.requestToCreateOrgUnfollowHistory(user, orgId);

      const org = await helpers.Org.requestToGetOneOrganizationAsMyself(user, orgId);

      expect(org.myselfData).toBeDefined();
      expect(org.myselfData.follow).toBeFalsy();
    });
  });

  describe('Single organization. List of followers', () => {
    describe('Positive scenarios', () => {
      it('should return list of org followers if fetching as guest', async () => {
        const orgId = 1;

        const followedByExpected = [
          userJane,
          userVlad
        ];

        for (let i = 0; i < followedByExpected.length; i++) {
          await helpers.Org.requestToCreateOrgFollowHistory(followedByExpected[i], orgId);
        }

        const org = await helpers.Org.requestToGetOneOrganizationAsGuest(orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(followedByExpected.length);

        followedByExpected.forEach(expected => {
          const actual = followedBy.find(data => data.id === expected.id);
          helpers.Users.checkUserPreview(actual);
        });
      });

      it('should return list of org followers if fetching as myself', async () => {
        const orgId = 1;

        const followedByExpected = [
          userJane,
          userVlad
        ];

        for (let i = 0; i < followedByExpected.length; i++) {
          await helpers.Org.requestToCreateOrgFollowHistory(followedByExpected[i], orgId);
        }

        const org = await helpers.Org.requestToGetOneOrganizationAsMyself(userVlad, orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(followedByExpected.length);

        followedByExpected.forEach(expected => {
          const actual = followedBy.find(data => data.id === expected.id);
          helpers.Users.checkUserPreview(actual);
        });
      });
    });

    describe('Negative scenarios', () => {
      it('should return list of empty followers if fetching as guest', async () => {
        const orgId = 1;
        const otherOrgId = 2;

        await helpers.Org.requestToCreateOrgFollowHistory(userVlad, otherOrgId); // to disturb data

        const org = await helpers.Org.requestToGetOneOrganizationAsGuest(orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(0);
      });

      it('should return list of empty followers if fetching as myself', async () => {
        const orgId = 1;
        const otherOrgId = 2;

        await helpers.Org.requestToCreateOrgFollowHistory(userVlad, otherOrgId); // to disturb data

        const org = await helpers.Org.requestToGetOneOrganizationAsMyself(userVlad, orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(0);
      });
    });
  });

  describe('User follows organization', function () {
    describe('Positive scenarios', () => {
      it('should create correct follow record in activity DB', async () => {
        const org_id = 1;
        const user = userJane;

        await helpers.Org.requestToFollowOrganization(org_id, user);

        const activity = await UserActivityRepository.findLastByUserId(user.id);
        expect(activity).toBeTruthy();

        // TODO - check activity structure
      });
    });

    describe('Negative scenarios', () => {
      it('should not be possible to follow twice', async () => {
        const org_id = 1;
        const user = userJane;

        await helpers.Org.requestToFollowOrganization(org_id, user);
        await helpers.Org.requestToFollowOrganization(org_id, user, 400);
      });

      it.skip('should not be possible to follow organization which does not exist', async () => {
        // TODO
      });
    });
  });

  describe('User unfollows organization', function () {
    describe('Positive scenarios', () => {
      it('should create correct unfollow record in activity DB', async () => {
        const org_id = 1;
        const user = userJane;

        await helpers.Org.requestToFollowOrganization(org_id, user);
        await helpers.Org.requestToUnfollowOrganization(org_id, user);

        const activity = await UserActivityRepository.findLastByUserId(user.id);
        expect(activity).toBeTruthy();

        // TODO - check activity structure
      });
    });

    describe('Negative scenarios', () => {
      it('should not be possible to unfollow organization without following beforehand', async () => {
        const org_id = 1;

        await helpers.Org.requestToFollowOrganization(org_id, userVlad); // this is an activity of other user
        await helpers.Org.requestToFollowOrganization(2, userJane); // this is an activity to follow other org
        const body = await helpers.Org.requestToUnfollowOrganization(org_id, userJane, 400);

        expect(body.errors.general).toMatch('unfollow before follow');
      });

      it.skip('should not be possible to unfollow twice', async () => {
        // TODO
      });
    });
  });
});