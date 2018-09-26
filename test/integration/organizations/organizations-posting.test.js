const helpers = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('User create post on behalf of organization', () => {
    describe('Positive scenarios', () => {
      it('should be possible to create media post on behalf of organization', async () => {
        // TODO
      });
    });

    describe('Negative scenarios', function () {
      it('should not be possible to create post without auth token', async () => {
        // TODO
      });
    });
  });

});