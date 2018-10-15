const _ = require('lodash');

const entityGen = require('../../generators').Entity;

const helpers                   = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');
const OrgRepository             = require('../../../lib/organizations/repository').Main;

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Mock.mockBlockchainPart();

describe('Get notifications', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });
  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Get One user notifications list', () => {
      it('sample', async () => {
        const orgId = 1;
        const myself = userVlad;

        await entityGen.Notifications.createPendingPrompt(userVlad, orgId);

        const models = await helpers.Notifications.requestToGetNotificationsList(myself);

        // TODO provide notifications checker helper
      });
  });
});