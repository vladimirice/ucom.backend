const helpers = require('../helpers');
const gen = require('../../generators');

const UsersFeedRepository = require('../../../lib/common/repository').UsersFeed;

helpers.Mock.mockAllBlockchainPart();

let userVlad, userJane, userPetr, userRokky;

const orgId = 1;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initUsersOnly();
    await helpers.Seeds.seedOrganizations();
  });

  describe('Organizations wall feed', () => {
    describe('Positive', () => {
      describe('Test pagination', async () => {
        it('Metadata', async () => {
          await gen.Posts.generateOrgPostsForWall(orgId, userVlad, userJane, 3);

          const page    = 1;
          const perPage = 2;

          const queryString = helpers.Req.getPaginationQueryString(page, perPage);
          const response = await helpers.Org.requestToGetOrgWallFeedAsGuest(orgId, queryString, false);

          const metadata = response.metadata;

          const totalAmount = await UsersFeedRepository.countAllForOrgWallFeed(orgId);

          expect(metadata).toBeDefined();
          expect(metadata.has_more).toBeTruthy();
          expect(metadata.page).toBe(page);
          expect(metadata.per_page).toBe(perPage);
          expect(metadata.total_amount).toBe(totalAmount);

          const lastPage = +Math.floor(totalAmount/perPage);

          const queryStringLast = helpers.Req.getPaginationQueryString(lastPage, perPage);

          const lastResponse = await helpers.Org.requestToGetOrgWallFeedAsGuest(orgId, queryStringLast, false);

          expect(lastResponse.metadata.has_more).toBeFalsy();
        });

        it.skip('Get two post pages', async () => {
          await gen.Posts.generateOrgPostsForWall(orgId, userVlad, userJane, 3);

          const perPage = 2;
          let page = 1;

          const queryString = helpers.Req.getPaginationQueryString(page, perPage);
          const posts     = await UsersFeedRepository.findAllForOrgWallFeed(orgId, queryString);
          const firstPage = await helpers.Org.requestToGetOrgWallFeedAsGuest(orgId, queryString);

          const expectedIdsOfFirstPage = [
            posts[page - 1].id,
            posts[page].id,
          ];

          expect(firstPage.length).toBe(perPage);

          firstPage.forEach((post, i) => {
            expect(post.id).toBe(expectedIdsOfFirstPage[i])
          });

          page = 2;
          const queryStringSecondPage = helpers.Req.getPaginationQueryString(page, perPage);
          const secondPage = await helpers.Org.requestToGetOrgWallFeedAsGuest(orgId, queryStringSecondPage);

          const expectedIdsOfSecondPage = [
            posts[page].id,
            posts[page + 1].id,
          ];

          expect(secondPage.length).toBe(perPage);

          secondPage.forEach((post, i) => {
            expect(post.id).toBe(expectedIdsOfSecondPage[i])
          });
        });

        it.skip('Page 0 and page 1 behavior must be the same', async () => {
          const perPage = 2;

          const pageIsZeroResponse = await helpers.Org.requestAllOrgsWithPagination(1, perPage, true);
          const pageIsOneResponse = await helpers.Org.requestAllOrgsWithPagination(1, perPage, true);

          expect(JSON.stringify(pageIsZeroResponse)).toBe(JSON.stringify(pageIsOneResponse));
        });
      });

      it('should get all org-related posts as Guest', async () => {
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