const helpers = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');
const UserActivityRepository = require('../../../lib/users/repository').Activity;

const models = require('../../../models');
const _ = require('lodash');

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('User follows-unfollows organizations', () => {
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

      it('should not be possible to follow organization which does not exist', async () => {
        // TODO
      });

      // TODO - add more scenarios from user follows user
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

      it('should not be possible to unfollow twice', async () => {
        // TODO
      });

      // TODO - add more scenarios from user follows user
    });
  });
});