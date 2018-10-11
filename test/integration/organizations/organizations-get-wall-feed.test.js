const helpers = require('../helpers');
const gen = require('../../generators');

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
        await helpers.Seeds.seedOrganizations();
        const orgId = 1;
        const otherOrgId = 4;

        // disturbance
        const otherPosts = await gen.Posts.generateOrgPostsForWall(otherOrgId, userJane, userVlad);
        const generatedPosts = await gen.Posts.generateOrgPostsForWall(orgId, userVlad, userJane);

        const posts = await helpers.Org.requestToGetOrgWallFeedAsGuest(orgId);

        const postsIdsValues = Object.values(generatedPosts);

        postsIdsValues.forEach(id => {
          expect(posts.some(post => post.id === id)).toBeTruthy();
        });

        Object.values(otherPosts).forEach(id => {
          expect(posts.some(post => post.id === id)).toBeFalsy();
        });

        await helpers.Common.checkPostsListFromApi(posts, Object.keys(generatedPosts).length, helpers.Common.getOptionsForListAndGuest());
      });

      it('should get all org-related posts as Myself', async () => {
        await helpers.Seeds.seedOrganizations();
        const orgId = 1;
        const otherOrgId = 4;

        // disturbance
        const otherPosts = await gen.Posts.generateOrgPostsForWall(otherOrgId, userJane, userVlad);
        const generatedPosts = await gen.Posts.generateOrgPostsForWall(orgId, userVlad, userJane);

        const posts = await helpers.Org.requestToGetOrgWallFeedAsMyself(userVlad, orgId);

        const postsIdsValues = Object.values(generatedPosts);

        postsIdsValues.forEach(id => {
          expect(posts.some(post => post.id === id)).toBeTruthy();
        });

        Object.values(otherPosts).forEach(id => {
          expect(posts.some(post => post.id === id)).toBeFalsy();
        });

        await helpers.Common.checkPostsListFromApi(posts, Object.keys(generatedPosts).length, helpers.Common.getOptionsForListAndMyself());
      });
    });
  });
});