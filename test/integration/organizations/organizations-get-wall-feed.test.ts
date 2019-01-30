import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');

import PostsGenerator = require('../../generators/posts-generator');
import RequestHelper = require('../helpers/request-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');
import ResponseHelper = require('../helpers/response-helper');
import CommonHelper = require('../helpers/common-helper');

const usersFeedRepository = require('../../../lib/common/repository').UsersFeed;

let userVlad: UserModel;
let userJane: UserModel;

const orgId: number = 1;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await SeedsHelper.initUsersOnly();
    await SeedsHelper.seedOrganizations(); // deprecated. Use generator
  });

  describe('Organizations wall feed', () => {
    describe('Positive', () => {
      describe('Test pagination', () => {
        it('Myself. smoke test', async () => {
          await PostsGenerator.generateOrgPostsForWall(orgId, userVlad, userJane, 3);

          const page    = 1;
          const perPage = 2;

          const queryString = RequestHelper.getPaginationQueryString(page, perPage);
          const response =
            await OrganizationsHelper.requestToGetOrgWallFeedAsMyself(
              userVlad,
              orgId,
              queryString,
              false,
            );
          const totalAmount = await usersFeedRepository.countAllForOrgWallFeed(orgId);

          ResponseHelper.checkMetadata(response, page, perPage, totalAmount, true);

          response.data.forEach((post) => {
            expect(post.description).toBeDefined();
          });
        });

        it('Metadata', async () => {
          await PostsGenerator.generateOrgPostsForWall(orgId, userVlad, userJane, 3);

          const page    = 1;
          let perPage = 2;

          const queryString = RequestHelper.getPaginationQueryString(page, perPage);
          const response =
            await OrganizationsHelper.requestToGetOrgWallFeedAsGuest(orgId, queryString, false);

          const totalAmount = await usersFeedRepository.countAllForOrgWallFeed(orgId);

          ResponseHelper.checkMetadata(response, page, perPage, totalAmount, true);

          perPage = 3;
          const lastPage = RequestHelper.getLastPage(totalAmount, perPage);

          const queryStringLast = RequestHelper.getPaginationQueryString(
            lastPage,
            perPage,
          );

          const lastResponse =
            await OrganizationsHelper.requestToGetOrgWallFeedAsGuest(orgId, queryStringLast, false);

          ResponseHelper.checkMetadata(lastResponse, lastPage, perPage, totalAmount, false);
        });

        it('Get two post pages', async () => {
          await PostsGenerator.generateOrgPostsForWall(orgId, userVlad, userJane, 3);

          const perPage = 2;
          let page = 1;

          const queryString = RequestHelper.getPaginationQueryString(page, perPage);
          const posts     = await usersFeedRepository.findAllForOrgWallFeed(orgId, {
            limit: 20,
          });
          const firstPage =
            await OrganizationsHelper.requestToGetOrgWallFeedAsGuest(orgId, queryString);

          const expectedIdsOfFirstPage = [
            posts[page - 1].id,
            posts[page].id,
          ];

          expect(firstPage.length).toBe(perPage);

          firstPage.forEach((post, i) => {
            expect(post.id).toBe(expectedIdsOfFirstPage[i]);
          });

          page = 2;
          const queryStringSecondPage = RequestHelper.getPaginationQueryString(page, perPage);
          const secondPage =
            await OrganizationsHelper.requestToGetOrgWallFeedAsGuest(orgId, queryStringSecondPage);

          const expectedIdsOfSecondPage = [
            posts[page].id,
            posts[page + 1].id,
          ];

          expect(secondPage.length).toBe(perPage);

          secondPage.forEach((post, i) => {
            expect(post.id).toBe(expectedIdsOfSecondPage[i]);
          });
        });
      });

      it('should get all org-related posts as Guest', async () => {
        const otherOrgId = 4;

        const [otherPosts, generatedPosts] = await Promise.all([
          PostsGenerator.generateOrgPostsForWall(otherOrgId, userJane, userVlad),
          PostsGenerator.generateOrgPostsForWall(orgId, userVlad, userJane),
        ]);

        const posts = await OrganizationsHelper.requestToGetOrgWallFeedAsGuest(orgId);

        // @ts-ignore
        const postsIdsValues = Object.values(generatedPosts);

        postsIdsValues.forEach((id) => {
          expect(posts.some(post => post.id === id)).toBeTruthy();
        });

        // @ts-ignore
        Object.values(otherPosts).forEach((id) => {
          expect(posts.some(post => post.id === id)).toBeFalsy();
        });

        await CommonHelper.checkPostsListFromApi(
          posts,
          Object.keys(generatedPosts).length,
          CommonHelper.getOptionsForListAndGuest(),
        );
      });

      it('should get all org-related posts as Myself', async () => {
        const otherOrgId = 4;

        // disturbance
        const otherPosts    =
          await PostsGenerator.generateOrgPostsForWall(otherOrgId, userJane, userVlad);
        const generatedPosts = await PostsGenerator.generateOrgPostsForWall(
          orgId,
          userVlad,
          userJane,
        );

        const posts = await OrganizationsHelper.requestToGetOrgWallFeedAsMyself(userVlad, orgId);

        // @ts-ignore
        const postsIdsValues = Object.values(generatedPosts);

        postsIdsValues.forEach((id) => {
          expect(posts.some(post => post.id === id)).toBeTruthy();
        });

        // @ts-ignore
        Object.values(otherPosts).forEach((id) => {
          expect(posts.some(post => post.id === id)).toBeFalsy();
        });

        await CommonHelper.checkPostsListFromApi(
          posts,
          Object.keys(generatedPosts).length,
          CommonHelper.getOptionsForListAndMyself(),
        );
      });
    });
  });
});

export {};
