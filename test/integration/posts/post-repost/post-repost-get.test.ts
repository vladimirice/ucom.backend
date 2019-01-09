export {};

const helpers = require('../../helpers');
const gen = require('../../../generators');

const postsHelper = require('../../helpers/posts-helper');

let userVlad;
let userJane;

helpers.Mock.mockAllBlockchainPart();

describe('Post repost API', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      helpers.Users.getUserVlad(),
      helpers.Users.getUserJane(),
      helpers.Users.getUserPetr(),
      helpers.Users.getUserRokky(),
    ]);
  });

  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
  });

  afterAll(async () => {
    await helpers.Seeds.sequelizeAfterAll();
  });

  describe('Get many posts with repost for feeds', () => {
    describe('Positive', () => {

      describe('For users wall', () => {
        it('Repost of user post wall list should have correct structure', async () => {
          const { repostId } = await gen.Posts.createNewPostWithRepost(userJane, userVlad);

          const userOtherPostId = await gen.Posts.createMediaPostByUserHimself(userVlad);

          const posts = await helpers.Users.requestToGetWallFeedAsGuest(userVlad);

          const mediaPost = posts.find(post => post.id === userOtherPostId);
          const repost = posts.find(post => post.id === repostId);
          const options = helpers.Common.getOptionsForListAndGuest();

          postsHelper.checkMediaPostFields(mediaPost, options);
          helpers.Common.checkOneRepostForList(repost, options, false);
        });
        it('Repost of user post ORG list should have correct structure', async () => {
          const orgId = await gen.Org.createOrgWithoutTeam(userJane);
          const parentPostId = await gen.Posts.createMediaPostOfOrganization(userJane, orgId);

          const userOtherPostId = await gen.Posts.createMediaPostByUserHimself(userVlad);
          const repostId = await gen.Posts.createRepostOfUserPost(userVlad, parentPostId);

          const posts = await helpers.Users.requestToGetWallFeedAsGuest(userVlad);

          const mediaPost = posts.find(post => post.id === userOtherPostId);
          const repost = posts.find(post => post.id === repostId);
          const options = helpers.Common.getOptionsForListAndGuest();

          postsHelper.checkMediaPostFields(mediaPost, options);
          helpers.Common.checkOneRepostForList(repost, options, true);
        });
      });

      describe('For users news feed', () => {
        it('News feed with repost of user himself post', async () => {
          const postsOwner       = userJane;
          const directPostAuthor = userVlad;

          const regularPostsAmount = 2;
          const postIds = await gen.Posts.generateUsersPostsForUserWall(
            postsOwner,
            directPostAuthor,
            regularPostsAmount,
          );

          const userVladPostId  = await gen.Posts.createMediaPostByUserHimself(userVlad);
          const janeRepostId    = await gen.Posts.createRepostOfUserPost(userJane, userVladPostId);

          await helpers.Activity.requestToCreateFollow(userVlad, userJane);

          const posts = await helpers.Users.requestToGetMyselfNewsFeed(userVlad);

          expect(posts.length).toBe(regularPostsAmount * 3 + 2);

          const mediaPost = posts.find(post => post.id === postIds[0]);
          const repost = posts.find(post => post.id === janeRepostId);
          const options = helpers.Common.getOptionsForListAndMyself();

          postsHelper.checkMediaPostFields(mediaPost, options);
          helpers.Common.checkOneRepostForList(repost, options, false);
        });

        it('News feed with repost of org post', async () => {
          const postsOwner       = userJane;
          const directPostAuthor = userVlad;

          const regularPostsAmount = 2;
          const postIds = await gen.Posts.generateUsersPostsForUserWall(
            postsOwner,
            directPostAuthor,
            regularPostsAmount,
          );

          const vladOrgId     = await gen.Org.createOrgWithoutTeam(userVlad);
          const vladOrgPostId = await gen.Posts.createMediaPostOfOrganization(userVlad, vladOrgId);

          const janeRepostId  = await gen.Posts.createRepostOfUserPost(userJane, vladOrgPostId);

          await helpers.Activity.requestToCreateFollow(userVlad, userJane);

          const posts = await helpers.Users.requestToGetMyselfNewsFeed(userVlad);

          expect(posts.length).toBe(regularPostsAmount * 3 + 1);

          const mediaPost = posts.find(post => post.id === postIds[0]);
          const repost = posts.find(post => post.id === janeRepostId);
          const options = helpers.Common.getOptionsForListAndMyself();

          postsHelper.checkMediaPostFields(mediaPost, options);
          helpers.Common.checkOneRepostForList(repost, options, true);
        });
      });
    });
  });

  describe('GET one post', () => {
    describe('Positive', () => {
      it('Get one post-repost of users post by ID', async () => {
        const { repostId } = await gen.Posts.createNewPostWithRepost(userJane, userVlad);

        const post = await postsHelper.requestToGetOnePostAsGuest(repostId);

        const options = {
          myselfData    : false,
          postProcessing: 'list',
        };

        helpers.Common.checkOneRepostForList(post, options, false);
      });

      it('Get one post-repost of org post by ID', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userJane);

        const parentPostId  = await gen.Posts.createMediaPostOfOrganization(userJane, orgId);
        const repostId      = await gen.Posts.createRepostOfUserPost(userVlad, parentPostId);

        const post = await postsHelper.requestToGetOnePostAsGuest(repostId);

        const options = {
          myselfData    : false,
          postProcessing: 'list',
        };

        helpers.Common.checkOneRepostForList(post, options, true);
      });
    });
  });

});
