const helpers = require('../helpers');

helpers.Mock.mockAllBlockchainPart();

let userVlad, userJane, userPetr, userRokky;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initUsersOnly();
  });

  describe('Organizations wall feed', () => {
    describe('Positive', () => {
      it('should get all org-related posts as Guest', async () => {
        const targetUser        = userVlad;
        const directPostAuthor  = userJane;

        await helpers.Seeds.seedOrganizations();
        const orgId = 1;

        const promisesToCreatePosts = [
          helpers.Posts.requestToCreateMediaPostOfOrganization(targetUser, orgId), // User himself creates posts
          helpers.Posts.requestToCreatePostOfferOfOrganization(targetUser, orgId),

          helpers.Posts.requestToCreateDirectPostForOrganization(directPostAuthor, orgId), // somebody creates post in users wall
        ];

        await Promise.all(promisesToCreatePosts);

        // Org creates one media post, one post offer and jane creates direct org comment
        const posts = await helpers.Org.requestToGetOrgWallFeedAsGuest(orgId);

        // TODO check posts contain concrete entities

        await helpers.Common.checkPostsListFromApi(posts, promisesToCreatePosts.length, helpers.Common.getOptionsForListAndGuest());
      });

      it('should get all org-related posts as Myself', async () => {
        // TODO check myself data
      });

    });
  });
});