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
  });

  describe('One organization', () => {
    it('Get one organization by ID as guest', async () => {
      const model_id = 1;

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(model_id);

      expect(model).toBeDefined();
      expect(model.id).toBe(model_id);

      helpers.UserHelper.checkIncludedUserPreview(model);
    });

    it('should not contain myself data if requesting as guest', async () => {
      const model_id = 1;

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(model_id);
      expect(model.myselfData).not.toBeDefined();
    });

    it('should contain myselfData if requesting with token', async () => {
      const model_id = 1;

      const model = await helpers.Organizations.requestToGetOneOrganizationAsMyself(userVlad, model_id);
      const myselfData = model.myselfData;

      expect(myselfData).toBeDefined();

      expect(myselfData.follow).toBeDefined();
      expect(myselfData.editable).toBeDefined();
      expect(myselfData.member).toBeDefined();
    });

    it('should contain myselfData editable false if request not from author', async () => {
      const model_id = await OrganizationsRepositories.Main.findLastIdByAuthor(userVlad.id);
      const model = await helpers.Organizations.requestToGetOneOrganizationAsMyself(userJane, model_id);

      expect(model.myselfData.editable).toBeFalsy();
      expect(model.myselfData.member).toBeFalsy();
    });

    it('should contain myselfData editable true and member true if author request his organization', async () => {
      const user = userVlad;

      const model_id = await OrganizationsRepositories.Main.findLastIdByAuthor(user.id);
      const model = await helpers.Organizations.requestToGetOneOrganizationAsMyself(user, model_id);

      expect(model.myselfData.editable).toBeTruthy();
      expect(model.myselfData.member).toBeTruthy();
    });
  });
});