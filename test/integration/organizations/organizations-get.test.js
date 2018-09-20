const helpers = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');

let userVlad;
let userJane;
let userPetr;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => { await helpers.SeedsHelper.sequelizeAfterAll(); });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organization lists', () => {
    it('Get organization lists without query string', async () => {
      const totalCount = await OrganizationsRepositories.Main.countAllOrganizations();
      const organizations = await helpers.Organizations.requestToGetOrganizationsAsGuest();

      expect(organizations).toBeDefined();
      expect(organizations instanceof Array).toBeTruthy();
      expect(organizations.length).toBe(totalCount);

      helpers.Organizations.checkOrganizationsPreviewFields(organizations);
    });

    it('Get all organizations by user ID', async () => {
      // TODO
    });
  });

  describe('One organization', () => {
    it('Get one organization by ID', async () => {
      // TODO
    });

    it('Get one organization by ID and author ID', async () => {
      // TODO
    });
  });
});