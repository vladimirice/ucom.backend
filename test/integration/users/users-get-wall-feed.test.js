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

  describe('Users wall feed', () => {
    describe('Positive', () => {
      it('should get all user-related posts as Guest', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts = [
          helpers.Posts.requestToCreateMediaPost(targetUser), // User himself creates posts
          helpers.Posts.requestToCreatePostOffer(targetUser),

          helpers.Posts.requestToCreateDirectPostForUser(directPostAuthor, targetUser), // somebody creates post in users wall
        ];

        await Promise.all(promisesToCreatePosts);

        const posts = await helpers.Users.requestToGetWallFeedAsGuest(targetUser);

        const options = {
          'myselfData': false,
          postProcessing: 'list',
        };

        await helpers.Common.checkPostsListFromApi(posts, promisesToCreatePosts.length, options);
      });

      it('should get all user-related posts as Myself but not user itself', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts = [
          helpers.Posts.requestToCreateMediaPost(targetUser), // User himself creates posts
          helpers.Posts.requestToCreatePostOffer(targetUser),

          helpers.Posts.requestToCreateDirectPostForUser(directPostAuthor, targetUser), // somebody creates post in users wall
        ];

        const [newMediaPostId, newPostOfferId] = await Promise.all(promisesToCreatePosts);

        await helpers.Posts.requestToUpvotePost(userJane, newMediaPostId);
        await helpers.Posts.requestToDownvotePost(userJane, newPostOfferId);

        // userJane upvotes userVlad posts
        const posts = await helpers.Users.requestToGetWallFeedAsMyself(userJane, targetUser);

        const options = {
          'myselfData': true,
          postProcessing: 'list',
        };

        await helpers.Common.checkPostsListFromApi(posts, promisesToCreatePosts.length, options);
      });
    });

    describe('Negative', () => {
      it('Should not show posts not related to user', async () => {
        // TODO
      });
    });
  });
});