/* eslint-disable max-len */
import MockHelper = require('../helpers/mock-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import RequestHelper = require('../helpers/request-helper');
import UsersHelper = require('../helpers/users-helper');
import ResponseHelper = require('../helpers/response-helper');
import CommonHelper = require('../helpers/common-helper');
import PostsHelper = require('../helpers/posts-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import TagsHelper = require('../helpers/tags-helper');

const usersFeedRepository = require('../../../lib/common/repository').UsersFeed;

MockHelper.mockAllTransactionSigning();
MockHelper.mockBlockchainPart();

let userVlad;
let userJane;


const JEST_TIMEOUT = 10000;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await SeedsHelper.initUsersOnly();
  });

  describe('Users wall feed', () => {
    describe('Positive', () => {
      describe('Test pagination', () => {
        it('Myself. smoke test', async () => {
          const wallOwner = userVlad;
          await PostsGenerator.generateUsersPostsForUserWall(wallOwner, userJane, 3);

          return;

          const page    = 1;
          const perPage = 2;

          const queryString = RequestHelper.getPaginationQueryString(page, perPage);
          const response =
            await UsersHelper.requestToGetWallFeedAsMyself(
              userJane,
              wallOwner,
              queryString,
              false,
            );
          const totalAmount = await usersFeedRepository.countAllForUserWallFeed(wallOwner.id);

          ResponseHelper.checkMetadataByValues(response, page, perPage, totalAmount, true);

          response.data.forEach((post) => {
            expect(post.description).toBeDefined();
          });
        });

        it('Metadata', async () => {
          const wallOwner = userVlad;
          await PostsGenerator.generateUsersPostsForUserWall(wallOwner, userJane, 3);

          const page    = 1;
          let perPage = 2;

          const queryString = RequestHelper.getPaginationQueryString(page, perPage);

          const response =
            await UsersHelper.requestToGetWallFeedAsGuest(wallOwner, queryString, false);
          const totalAmount = await usersFeedRepository.countAllForUserWallFeed(wallOwner.id);

          ResponseHelper.checkMetadataByValues(response, page, perPage, totalAmount, true);

          perPage = 3;
          const lastPage = RequestHelper.getLastPage(totalAmount, perPage);

          const queryStringLast = RequestHelper.getPaginationQueryString(
            lastPage,
            perPage,
          );

          const lastResponse =
            await UsersHelper.requestToGetWallFeedAsGuest(wallOwner, queryStringLast, false);

          ResponseHelper.checkMetadataByValues(lastResponse, lastPage, perPage, totalAmount, false);
        });

        it('Get two post pages', async () => {
          const wallOwner = userVlad;
          await PostsGenerator.generateUsersPostsForUserWall(wallOwner, userJane, 3);

          const perPage = 2;
          let page = 1;

          const posts = await usersFeedRepository.findAllForUserWallFeed(wallOwner.id);
          const expectedIdsOfFirstPage = [
            posts[page - 1].id,
            posts[page].id,
          ];

          const queryString = RequestHelper.getPaginationQueryString(page, perPage);
          const firstPage = await UsersHelper.requestToGetWallFeedAsGuest(wallOwner, queryString);

          expect(firstPage.length).toBe(perPage);

          firstPage.forEach((post, i) => {
            expect(post.id).toBe(expectedIdsOfFirstPage[i]);
          });

          page = 2;
          const queryStringSecondPage = RequestHelper.getPaginationQueryString(page, perPage);
          const secondPage =
            await UsersHelper.requestToGetWallFeedAsGuest(wallOwner, queryStringSecondPage);

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

      it('should get all user-related posts as Guest', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts: any = [
          PostsGenerator.createMediaPostByUserHimself(targetUser),
          PostsGenerator.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
        ];

        await Promise.all(promisesToCreatePosts);

        const posts = await UsersHelper.requestToGetWallFeedAsGuest(targetUser);

        const options = {
          myselfData: false,
          postProcessing: 'list',
        };

        await CommonHelper.checkPostsListFromApi(posts, promisesToCreatePosts.length, options);
      });

      it('should get all user-related posts as Myself but not user itself', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts: any = [
          PostsGenerator.createMediaPostByUserHimself(targetUser),
          PostsGenerator.createPostOfferByUserHimself(targetUser),
          PostsGenerator.createUserDirectPostForOtherUser(directPostAuthor, targetUser),
        ];

        const [newMediaPostId, newPostOfferId] =
          await Promise.all(promisesToCreatePosts);

        // @ts-ignore
        await PostsHelper.requestToUpvotePost(userJane, newMediaPostId);
        await PostsHelper.requestToDownvotePost(userJane, newPostOfferId);

        // userJane upvotes userVlad posts
        const posts = await UsersHelper.requestToGetWallFeedAsMyself(userJane, targetUser);

        const options = {
          myselfData: true,
          postProcessing: 'list',
        };

        await CommonHelper.checkPostsListFromApi(posts, promisesToCreatePosts.length, options);
      }, JEST_TIMEOUT);
    });
  });

  it('Get tag wall feed', async () => {
    const tagName       = 'summer';
    const otherTagName  = 'summertime';

    const descriptions = [
      `Hi everyone! #${tagName} is so close. Lets organize an #${otherTagName}`,
      `Hi everyone! #${otherTagName} is so close. Lets organize an #${tagName}`,
      `Hi everyone! #${tagName} is so close`,
      `Hi everyone! #${otherTagName} is so close`,
    ];

    const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

    const promisesToCreatePosts = [
      PostsGenerator.createMediaPostByUserHimself(userVlad, { description: descriptions[0] }),
      PostsGenerator.createMediaPostOfOrganization(userVlad, orgId, { description: descriptions[1] }),

      PostsGenerator.createMediaPostByUserHimself(userJane, { description: descriptions[2] }),
      PostsGenerator.createMediaPostByUserHimself(userJane, { description: descriptions[3] }),
    ];

    const expectedLength: number = promisesToCreatePosts.length - 1;

    const [vladHimselfPostId, vladOrgPostId, janeHerselfPostId, janeHerselfNotRelatedPostId] =
      await Promise.all(promisesToCreatePosts);

    await PostsGenerator.createMediaPostByUserHimself(userVlad);

    await Promise.all([
      TagsHelper.getPostWhenTagsAreProcessed(vladHimselfPostId),
      TagsHelper.getPostWhenTagsAreProcessed(vladOrgPostId),
      TagsHelper.getPostWhenTagsAreProcessed(janeHerselfPostId),
      TagsHelper.getPostWhenTagsAreProcessed(janeHerselfNotRelatedPostId),
    ]);

    const url = RequestHelper.getTagsWallFeedUrl(tagName);

    const models = await RequestHelper.makeGetRequestForList(url);

    expect(models.some((item): any => item.id === vladHimselfPostId)).toBeTruthy();
    expect(models.some((item): any => item.id === vladOrgPostId)).toBeTruthy();
    expect(models.some((item): any => item.id === janeHerselfPostId)).toBeTruthy();
    expect(models.some((item): any => item.id === janeHerselfNotRelatedPostId)).toBeFalsy();

    const options = {
      myselfData: false,
      postProcessing: 'list',
    };

    await CommonHelper.checkPostsListFromApi(models, expectedLength, options);
  });

  describe('Posts feeds skipped tests - implement them in future', () => {
    it.skip('Should not show posts not related to user', async () => {});
  });
});

export {};
