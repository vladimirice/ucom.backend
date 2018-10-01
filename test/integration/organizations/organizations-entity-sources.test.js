const helpers = require('../helpers');
const OrgModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
const UsersModelProvider = require('../../../lib/users/users-model-provider');

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Org.mockBlockchainPart();

describe('Organizations. Entity source related creation-updating', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Searching for existing community and partnership', async () => {
    describe('Positive scenarios', () => {

      it('Find organizations as community and be case insensitive', async () => {
        const vladIncId = 1;
        const janeIncId = 3;

        const body = await helpers.Org.requestToSearchCommunity('inc');
        expect(body.length).toBe(2);

        expect(body.some(data => data.id === vladIncId)).toBeTruthy();
        expect(body.some(data => data.id === janeIncId)).toBeTruthy();
      });

      it('Find both users and organizations as partnership', async () => {
        const vladIncId = 1;

        const body = await helpers.Org.requestToSearchPartnership('vlad');

        expect(body.length).toBe(4);
        const vladIncFromResponse = body.find(data => data.id === vladIncId);
        const userVladFromResponse = body.find(data => data.id === userVlad.id && data.account_name === userVlad.account_name);

        expect(vladIncFromResponse).toBeDefined();
        expect(userVladFromResponse).toBeDefined();

        expect(vladIncFromResponse.entity_name).toBe(OrgModelProvider.getEntityName());
        expect(userVladFromResponse.entity_name).toBe(UsersModelProvider.getEntityName());
      });
    });

    describe('Negative scenarios', () => {
      it('No community if search query match nothing', async () => {
        // TODO
      });

      it('No partnership if search query is wrong', async () => {
        // TODO
      });
    });
  });

});