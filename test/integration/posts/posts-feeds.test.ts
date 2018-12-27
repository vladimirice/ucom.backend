const helpers = require('../helpers');
const gen = require('../../generators');

const mockHelper = require('../helpers/mock-helper');
const usersFeedRepository = require('../../../lib/common/repository').UsersFeed;

const tagsHelper = require('../helpers/tags-helper');

mockHelper.mockAllTransactionSigning();
mockHelper.mockBlockchainPart();

let userVlad;
let userJane;
let userPetr;
let userRokky;

const requestHelper = require('../helpers/request-helper');

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
  });

  describe('Users wall feed', () => {
    describe('Positive', () => {
      describe('Test pagination', async () => {

        it('Myself. smoke test', async () => {
          const wallOwner = userVlad;
          await gen.Posts.generateUsersPostsForUserWall(wallOwner, userJane, 3);

          const page    = 1;
          const perPage = 2;

          const queryString = helpers.Req.getPaginationQueryString(page, perPage);
          const response =
            await helpers.Users.requestToGetWallFeedAsMyself(
              userJane,
              wallOwner,
              queryString,
              false,
            );
          const totalAmount = await usersFeedRepository.countAllForUserWallFeed(wallOwner.id);

          helpers.Res.checkMetadata(response, page, perPage, totalAmount, true);

          response.data.forEach((post) => {
            expect(post.description).toBeDefined();
          });
        });

        it('Metadata', async () => {

          const wallOwner = userVlad;
          await gen.Posts.generateUsersPostsForUserWall(wallOwner, userJane, 3);

          const page    = 1;
          let perPage = 2;

          const queryString = helpers.Req.getPaginationQueryString(page, perPage);

          const response =
            await helpers.Users.requestToGetWallFeedAsGuest(wallOwner, queryString, false);
          const totalAmount = await usersFeedRepository.countAllForUserWallFeed(wallOwner.id);

          helpers.Res.checkMetadata(response, page, perPage, totalAmount, true);

          perPage = 3;
          const lastPage = helpers.Req.getLastPage(totalAmount, perPage);

          const queryStringLast = helpers.Req.getPaginationQueryString(
            lastPage,
            perPage,
          );

          const lastResponse =
            await helpers.Users.requestToGetWallFeedAsGuest(wallOwner, queryStringLast, false);

          helpers.Res.checkMetadata(lastResponse, lastPage, perPage, totalAmount, false);
        });

        it('Get two post pages', async () => {
          const wallOwner = userVlad;
          await gen.Posts.generateUsersPostsForUserWall(wallOwner, userJane, 3);

          const perPage = 2;
          let page = 1;

          const posts = await usersFeedRepository.findAllForUserWallFeed(wallOwner.id);
          const expectedIdsOfFirstPage = [
            posts[page - 1].id,
            posts[page].id,
          ];

          const queryString = helpers.Req.getPaginationQueryString(page, perPage);
          const firstPage = await helpers.Users.requestToGetWallFeedAsGuest(wallOwner, queryString);

          expect(firstPage.length).toBe(perPage);

          firstPage.forEach((post, i) => {
            expect(post.id).toBe(expectedIdsOfFirstPage[i]);
          });

          page = 2;
          const queryStringSecondPage = helpers.Req.getPaginationQueryString(page, perPage);
          const secondPage =
            await helpers.Users.requestToGetWallFeedAsGuest(wallOwner, queryStringSecondPage);

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

        const promisesToCreatePosts = [
          gen.Posts.createMediaPostByUserHimself(targetUser),
          gen.Posts.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
        ];

        await Promise.all(promisesToCreatePosts);

        const posts = await helpers.Users.requestToGetWallFeedAsGuest(targetUser);

        const options = {
          myselfData: false,
          postProcessing: 'list',
        };

        await helpers.Common.checkPostsListFromApi(posts, promisesToCreatePosts.length, options);
      });

      it('should get all user-related posts as Myself but not user itself', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts = [
          gen.Posts.createMediaPostByUserHimself(targetUser),
          gen.Posts.createPostOfferByUserHimself(targetUser),
          gen.Posts.createUserDirectPostForOtherUser(directPostAuthor, targetUser),
        ];

        const [newMediaPostId, newPostOfferId] = await Promise.all(promisesToCreatePosts);

        await helpers.Posts.requestToUpvotePost(userJane, newMediaPostId);
        await helpers.Posts.requestToDownvotePost(userJane, newPostOfferId);

        // userJane upvotes userVlad posts
        const posts = await helpers.Users.requestToGetWallFeedAsMyself(userJane, targetUser);

        const options = {
          myselfData: true,
          postProcessing: 'list',
        };

        await helpers.Common.checkPostsListFromApi(posts, promisesToCreatePosts.length, options);
      });
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

    const orgId = await gen.Org.createOrgWithoutTeam(userVlad);

    const promisesToCreatePosts = [
      gen.Posts.createMediaPostByUserHimself(userVlad, { description: descriptions[0] }),
      gen.Posts.createMediaPostOfOrganization(userVlad, orgId, { description: descriptions[1] }),

      gen.Posts.createMediaPostByUserHimself(userJane, { description: descriptions[2] }),
      gen.Posts.createMediaPostByUserHimself(userJane, { description: descriptions[3] }),
    ];

    const expectedLength = promisesToCreatePosts.length - 1;

    const [vladHimselfPostId, vladOrgPostId, janeHerselfPostId, janeHerselfNotRelatedPostId] =
      await Promise.all(promisesToCreatePosts);

    await gen.Posts.createMediaPostByUserHimself(userVlad);

    await Promise.all([
      tagsHelper.getPostWhenTagsAreProcessed(vladHimselfPostId),
      tagsHelper.getPostWhenTagsAreProcessed(vladOrgPostId),
      tagsHelper.getPostWhenTagsAreProcessed(janeHerselfPostId),
      tagsHelper.getPostWhenTagsAreProcessed(janeHerselfNotRelatedPostId),
    ]);

    const url = helpers.Req.getTagsWallFeedUrl(tagName);

    const models = await requestHelper.makeGetRequestForList(url);

    expect(models.some((item): any => item.id === vladHimselfPostId)).toBeTruthy();
    expect(models.some((item): any => item.id === vladOrgPostId)).toBeTruthy();
    expect(models.some((item): any => item.id === janeHerselfPostId)).toBeTruthy();
    expect(models.some((item): any => item.id === janeHerselfNotRelatedPostId)).toBeFalsy();

    const options = {
      myselfData: false,
      postProcessing: 'list',
    };

    await helpers.Common.checkPostsListFromApi(models, expectedLength, options);
  });

  describe('Posts feeds skipped tests - implement them in future', () => {
    it.skip('Should not show posts not related to user', async () => {});
  });

});
