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

        it('Myself. smoke test', async () => {
          await gen.Posts.generateOrgPostsForWall(orgId, userVlad, userJane, 3);

          const page    = 1;
          const perPage = 2;

          const queryString = helpers.Req.getPaginationQueryString(page, perPage);
          const response = await helpers.Org.requestToGetOrgWallFeedAsMyself(userVlad, orgId, queryString, false);
          const totalAmount = await UsersFeedRepository.countAllForOrgWallFeed(orgId);

          helpers.Res.checkMetadata(response, page, perPage, totalAmount, true);

          response.data.forEach(post => {
            expect(post.description).toBeDefined();
          });
        });

        it('Metadata', async () => {
          await gen.Posts.generateOrgPostsForWall(orgId, userVlad, userJane, 3);

          const page    = 1;
          let perPage = 2;

          const queryString = helpers.Req.getPaginationQueryString(page, perPage);
          const response = await helpers.Org.requestToGetOrgWallFeedAsGuest(orgId, queryString, false);

          const totalAmount = await UsersFeedRepository.countAllForOrgWallFeed(orgId);

          helpers.Res.checkMetadata(response, page, perPage, totalAmount, true);

          perPage = 3;
          let lastPage = helpers.Req.getLastPage(totalAmount, perPage);

          const queryStringLast = helpers.Req.getPaginationQueryString(
            lastPage,
            perPage
          );

          const lastResponse = await helpers.Org.requestToGetOrgWallFeedAsGuest(orgId, queryStringLast, false);

          helpers.Res.checkMetadata(lastResponse, lastPage, perPage, totalAmount, false);
        });

        it('Get two post pages', async () => {
          await gen.Posts.generateOrgPostsForWall(orgId, userVlad, userJane, 3);

          const perPage = 2;
          let page = 1;

          const queryString = helpers.Req.getPaginationQueryString(page, perPage);
          const posts     = await UsersFeedRepository.findAllForOrgWallFeed(orgId, {
            limit: 20
          });
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