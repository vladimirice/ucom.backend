const helpers = require('../helpers');

helpers.Mock.mockAllBlockchainPart();

let userVlad, userJane, userPetr, userRokky;

describe('Myself. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initUsersOnly();
  });

  describe('Get myself news feed', () => {
    describe('Positive', () => {
      it('should get myself news feed with posts of entities I follow', async () => {
        const myself = userVlad;

        const promisesToCreatePosts = [
          helpers.Posts.requestToCreateMediaPost(myself), // User himself creates posts
          helpers.Posts.requestToCreatePostOffer(myself),

          helpers.Posts.requestToCreateDirectPostForUser(userJane, myself), // somebody creates post in users wall
        ];

        await Promise.all(promisesToCreatePosts);

        const posts = await helpers.Users.requestToGetMyselfNewsFeed(myself);

        // TODO
      });

      it('should see myself wall-feed inside myself news-feed', async () => {
        // TODO
      });
    });

    describe('Negative', () => {
      it('should not be possible to get news-feed without auth token', async () => {
        // TODO
      });
    });
  });
});