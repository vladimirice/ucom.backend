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

        await entityGen.Notifications.createPendingPrompt(userVlad.id, orgId);

        // const res = await helpers.Notifications.requestToConfirmPrompt(userVlad, 1);
        // const res = await helpers.Notifications.requestToDeclinePrompt(userVlad, 1);
        // await helpers.Notifications.requestToPendingPrompt(userVlad, 1);

        const models = await helpers.Notifications.requestToGetNotificationsList(myself);

        const options = helpers.Common.getOptionsForListAndMyself();

        helpers.Common.checkNotificationsList(models, 1, options);



        // At first just check existance

        // TODO provide notifications checker helper

        // Notification validation structure
        /*
          * ORDER BY finished ASC, created_at DESC
          * pagination
          * structure itself
         */
      }, 50000);
  });
});