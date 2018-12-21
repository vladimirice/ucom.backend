const helpers = require('../helpers');
const gen     = require('../../generators');

let userVlad, userJane, userPetr, userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('GET tags', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
  });

  afterAll(async () => { await helpers.Seeds.doAfterAll(); });

  it('Get one tag page by tag ID [Legacy]', async () => {
    // TODO use generator
    const tagId = 1;

    await helpers.Tags.requestToGetOneTagPageByIdAsGuest(tagId);
  });

  it('Get one tag page by tag name', async () => {
    // TODO use generator
    const tagName = 'null';

    await helpers.Tags.requestToGetOneTagPageByTitleAsGuest(tagName);
  });

  it('[Smoke] Get tag wall feed', async () => {
    const tagTitle = 'null';

    await gen.Posts.createMediaPostByUserHimself(userVlad);

    const url = helpers.Req.getTagsWallFeedUrl(tagTitle);

    await helpers.Req.makeGetRequestForList(url, true);
  });

  it('[Smoke] Get tag related organizations', async () => {
    const tagTitle = 'null';

    await gen.Org.createOrgWithoutTeam(userVlad);

    const url = helpers.Req.getTagsOrgUrl(tagTitle);

    await helpers.Req.makeGetRequestForList(url, true);
  });

  it('[Smoke] Get tag related users', async () => {
    const tagTitle = 'null';

    const url = helpers.Req.getTagsUsersUrl(tagTitle) + '/?v2=true';

    await helpers.Req.makeGetRequestForList(url, true);
  });
});
