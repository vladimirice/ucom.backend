import MockHelper = require('../helpers/mock-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');
import UsersHelper = require('../helpers/users-helper');
import UsersActivityRepository = require('../../../lib/users/repository/users-activity-repository');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import UsersActivityFollowRepository = require('../../../lib/users/repository/users-activity/users-activity-follow-repository');
import CommonChecker = require('../../helpers/common/common-checker');

let userVlad;
let userJane;
let userRokky;

MockHelper.mockAllBlockchainPart();

describe('User follows-unfollows organizations. Without transaction checking.', () => {
  beforeAll(async ()  => {
    [userVlad, userJane, , userRokky] = await SeedsHelper.beforeAllRoutine();
  });
  afterAll(async ()   => { await SeedsHelper.sequelizeAfterAll(); });
  beforeEach(async () => {
    await SeedsHelper.resetOrganizationRelatedSeeds();
  });


  describe('Users activity follow index table', () => {
    it('users activity follow index record is created and then deleted after unfollow activity', async () => {
      const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      await OrganizationsHelper.requestToCreateOrgFollowHistory(userJane, orgId);
      const followRecord = await UsersActivityFollowRepository.getUserFollowsOrg(userJane.id, orgId);

      CommonChecker.expectNotEmpty(followRecord);

      await OrganizationsHelper.requestToUnfollowOrganization(orgId, userJane);

      const nullableRecord = await UsersActivityFollowRepository.getUserFollowsOrg(userJane.id, orgId);

      expect(nullableRecord).toBe(null);
    });
  });

  describe('Single organization. Follow inside myselfData', () => {
    it('MyselfData contains follow', async () => {
      const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      await OrganizationsHelper.requestToCreateOrgFollowHistory(userRokky, orgId);
      const org = await OrganizationsHelper.requestToGetOneOrganizationAsMyself(userRokky, orgId);

      expect(org.myselfData).toBeDefined();
      expect(org.myselfData.follow).toBeTruthy();
    });

    it('MyselfData contains follow false', async () => {
      const orgId = 1;
      const otherOrgId = 2;
      const user = userRokky;

      // In order to disturb conditions somehow
      await OrganizationsHelper.requestToCreateOrgFollowHistory(userJane, orgId);
      await OrganizationsHelper.requestToCreateOrgFollowHistory(userVlad, orgId);

      await OrganizationsHelper.requestToCreateOrgFollowHistory(user, otherOrgId);
      await OrganizationsHelper.requestToCreateOrgUnfollowHistory(user, orgId);

      const org = await OrganizationsHelper.requestToGetOneOrganizationAsMyself(user, orgId);

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
          await OrganizationsHelper.requestToCreateOrgFollowHistory(followedByExpected[i], orgId);
        }

        const org = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(followedByExpected.length);

        followedByExpected.forEach((expected) => {
          const actual = followedBy.find(data => data.id === expected.id);
          UsersHelper.checkUserPreview(actual);
        });
      });

      it('should return list of org followers if fetching as myself', async () => {
        const orgId = 1;

        const followedByExpected = [
          userJane,
          userVlad,
        ];

        for (let i = 0; i < followedByExpected.length; i += 1) {
          await OrganizationsHelper.requestToCreateOrgFollowHistory(followedByExpected[i], orgId);
        }

        const org = await OrganizationsHelper.requestToGetOneOrganizationAsMyself(userVlad, orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(followedByExpected.length);

        followedByExpected.forEach((expected) => {
          const actual = followedBy.find(data => data.id === expected.id);
          UsersHelper.checkUserPreview(actual);
        });
      });
    });

    describe('Negative scenarios', () => {
      it('should return list of empty followers if fetching as guest', async () => {
        const orgId = 1;
        const otherOrgId = 2;

        await OrganizationsHelper.requestToCreateOrgFollowHistory(userVlad, otherOrgId); // to disturb data

        const org = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);

        const followedBy = org.followed_by;
        expect(followedBy).toBeTruthy();
        expect(followedBy.length).toBe(0);
      });

      it('should return list of empty followers if fetching as myself', async () => {
        const orgId = 1;
        const otherOrgId = 2;

        await OrganizationsHelper.requestToCreateOrgFollowHistory(userVlad, otherOrgId); // to disturb data

        const org = await OrganizationsHelper.requestToGetOneOrganizationAsMyself(userVlad, orgId);

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

        await OrganizationsHelper.requestToFollowOrganization(orgId, user);

        const activity = await UsersActivityRepository.findLastByUserId(user.id);
        expect(activity).toBeTruthy();

        // #task - check activity structure
      });
    });

    describe('Negative scenarios', () => {
      it('should not be possible to follow twice', async () => {
        const orgId = 1;
        const user = userJane;

        await OrganizationsHelper.requestToFollowOrganization(orgId, user);
        await OrganizationsHelper.requestToFollowOrganization(orgId, user, 400);
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

        await OrganizationsHelper.requestToFollowOrganization(orgId, user);
        await OrganizationsHelper.requestToUnfollowOrganization(orgId, user);

        const activity = await UsersActivityRepository.findLastByUserId(user.id);
        expect(activity).toBeTruthy();

        // #task - check activity structure
      });
    });

    describe('Negative scenarios', () => {
      // tslint:disable-next-line:max-line-length
      it('should not be possible to unfollow organization without following beforehand', async () => {
        const orgId = 1;

        // tslint:disable-next-line:max-line-length
        await OrganizationsHelper.requestToFollowOrganization(orgId, userVlad); // this is an activity of other user
        // tslint:disable-next-line:max-line-length
        await OrganizationsHelper.requestToFollowOrganization(2, userJane); // this is an activity to follow other org
        const body = await OrganizationsHelper.requestToUnfollowOrganization(orgId, userJane, 400);

        expect(body.errors.general).toMatch('unfollow before follow');
      });

      it.skip('should not be possible to unfollow twice', async () => {
      });
    });
  });
});

export {};
