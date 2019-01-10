export {};

const helpers = require('../helpers');
const userActivityRepository = require('../../../lib/users/repository').Activity;

let userVlad;
let userJane;
let userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('User follows-unfollows organizations. Without transaction checking.', () => {
  beforeAll(async ()  => {
    [userVlad, userJane, , userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
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
          userVlad,
        ];

        for (let i = 0; i < followedByExpected.length; i += 1) {
          await helpers.Org.requestToCreateOrgFollowHistory(followedByExpected[i], orgId);
        }

        const org = await helpers.Org.requestToGetOneOrganizationAsGuest(orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(followedByExpected.length);

        followedByExpected.forEach((expected) => {
          const actual = followedBy.find(data => data.id === expected.id);
          helpers.Users.checkUserPreview(actual);
        });
      });

      it('should return list of org followers if fetching as myself', async () => {
        const orgId = 1;

        const followedByExpected = [
          userJane,
          userVlad,
        ];

        for (let i = 0; i < followedByExpected.length; i += 1) {
          await helpers.Org.requestToCreateOrgFollowHistory(followedByExpected[i], orgId);
        }

        const org = await helpers.Org.requestToGetOneOrganizationAsMyself(userVlad, orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(followedByExpected.length);

        followedByExpected.forEach((expected) => {
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

  describe('User follows organization', () => {
    describe('Positive scenarios', () => {
      it('should create correct follow record in activity DB', async () => {
        const orgId = 1;
        const user = userJane;

        await helpers.Org.requestToFollowOrganization(orgId, user);

        const activity = await userActivityRepository.findLastByUserId(user.id);
        expect(activity).toBeTruthy();

        // #task - check activity structure
      });
    });

    describe('Negative scenarios', () => {
      it('should not be possible to follow twice', async () => {
        const orgId = 1;
        const user = userJane;

        await helpers.Org.requestToFollowOrganization(orgId, user);
        await helpers.Org.requestToFollowOrganization(orgId, user, 400);
      });

      it.skip('should not be possible to follow organization which does not exist', async () => {
      });
    });
  });

  describe('User unfollows organization', () => {
    describe('Positive scenarios', () => {
      it('should create correct unfollow record in activity DB', async () => {
        const orgId = 1;
        const user = userJane;

        await helpers.Org.requestToFollowOrganization(orgId, user);
        await helpers.Org.requestToUnfollowOrganization(orgId, user);

        const activity = await userActivityRepository.findLastByUserId(user.id);
        expect(activity).toBeTruthy();

        // #task - check activity structure
      });
    });

    describe('Negative scenarios', () => {
      // tslint:disable-next-line:max-line-length
      it('should not be possible to unfollow organization without following beforehand', async () => {
        const orgId = 1;

        // tslint:disable-next-line:max-line-length
        await helpers.Org.requestToFollowOrganization(orgId, userVlad); // this is an activity of other user
        // tslint:disable-next-line:max-line-length
        await helpers.Org.requestToFollowOrganization(2, userJane); // this is an activity to follow other org
        const body = await helpers.Org.requestToUnfollowOrganization(orgId, userJane, 400);

        expect(body.errors.general).toMatch('unfollow before follow');
      });

      it.skip('should not be possible to unfollow twice', async () => {
      });
    });
  });
});
