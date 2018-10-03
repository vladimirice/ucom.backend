const helpers = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');

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

  describe('User follows organization', function () {
    describe('Positive scenarios', () => {
      it('should create correct follow record in activity DB', async () => {
        // TODO
      });
    });

    describe('Negative scenarios', () => {
      it('should not be possible to follow organization which does not exist', async () => {
        // TODO
      });

      // TODO - add more scenarios from user follows user
    });
  });

  describe('User unfollows organization', function () {
    describe('Positive scenarios', () => {
      it('should create correct unfollow record in activity DB', async () => {
        // TODO
      });
    });

    describe('Negative scenarios', () => {
      it('should not be possible to unfollow organization without following beforehand', async () => {
        // TODO
      });

      // TODO - add more scenarios from user follows user
    });
  });
});