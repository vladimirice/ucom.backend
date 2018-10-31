const helpers = require('../helpers');
const gen = require('../../generators');

let userVlad, userJane, userPetr, userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('Post repost API', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr, userRokky] = await Promise.all([
      helpers.Users.getUserVlad(),
      helpers.Users.getUserJane(),
      helpers.Users.getUserPetr(),
      helpers.Users.getUserRokky(),
    ]);
  });

  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
  });

  afterAll(async () => {
    await helpers.Seeds.sequelizeAfterAll();
  });

  describe('GET one post', () => {
    describe('Positive', () => {
      it('Get one post-repost of users post by ID', async () => {
        const parentPostId  = await gen.Posts.createMediaPostByUserHimself(userJane);
        const repostId      = await gen.Posts.createRepostOfUserPost(userVlad, parentPostId);

        const post = await helpers.Posts.requestToGetOnePostAsGuest(repostId);

        const options = {
          'myselfData'    : false,
          'postProcessing': 'list',
        };

        helpers.Common.checkOneRepostForList(post, options, false);
      });

      it('Get one post-repost of org post by ID', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userJane);

        const parentPostId  = await gen.Posts.createMediaPostOfOrganization(userJane, orgId);
        const repostId      = await gen.Posts.createRepostOfUserPost(userVlad, parentPostId);

        const post = await helpers.Posts.requestToGetOnePostAsGuest(repostId);

        const options = {
          'myselfData'    : false,
          'postProcessing': 'list',
        };

        helpers.Common.checkOneRepostForList(post, options, true);
      });
    });
  });

});