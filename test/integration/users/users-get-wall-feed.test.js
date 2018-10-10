const helpers = require('../helpers');
const PostsRepository = require('../../../lib/posts/repository');

const UsersActivityRepository = require('../../../lib/users/repository').Activity;
const ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
const PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');
const OrgModelProvider = require('../../../lib/organizations/service').ModelProvider;


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
      it('should get all user-related posts', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts = [
          helpers.Posts.requestToCreateMediaPost(targetUser), // User himself creates posts
          helpers.Posts.requestToCreatePostOffer(targetUser),

          helpers.Posts.requestToCreateDirectPostForUser(directPostAuthor, targetUser), // somebody creates post in users wall
        ];

        await Promise.all(promisesToCreatePosts);

        const posts = await helpers.Users.requestToGetWallFeedAsGuest(targetUser);

        await helpers.Common.checkPostsListFromApi(posts, promisesToCreatePosts.length);
      });
    });
  });
});