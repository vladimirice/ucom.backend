const helpers = require('../helpers');

let userVlad, userJane, userPetr, userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('GET tags', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await helpers.Seeds.destroyTables();
    await helpers.Seeds.initUsersOnly();
  });

  afterAll(async () => { await helpers.Seeds.doAfterAll(); });

  it('Get one tag page', async () => {
    // TODO use generator
    const tagId = 1;

    const tag = await helpers.Tags.requestToGetOneTagPageAsGuest(tagId);
  });
});
