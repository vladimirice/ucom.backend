import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import UsersHelper = require('../../helpers/users-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import CommonHelper = require('../../helpers/common-helper');
import PostsHelper = require('../../helpers/posts-helper');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import ActivityHelper = require('../../helpers/activity-helper');
import UsersActivityRequestHelper = require('../../../helpers/users/activity/users-activity-request-helper');
import CommonChecker = require('../../../helpers/common/common-checker');

let userVlad: UserModel;
let userJane: UserModel;

beforeAll(async () => { await SeedsHelper.withGraphQlMockAllWorkers(); });
beforeEach(async () => { [userVlad, userJane] = await SeedsHelper.beforeAllRoutineMockAccountsProperties(); });
afterAll(async () => { await SeedsHelper.afterAllWithGraphQl(); });


describe('Repost of auto-update', () => {
  it('should contain parent auto update with json_data', async () => {
    const postAutoUpdateId =
      await UsersActivityRequestHelper.trustOneUserWithFakeAutoUpdateAndGetId(userVlad, userJane.id);

    const repostId = await PostsGenerator.createRepostOfUserPost(userJane, postAutoUpdateId);

    const posts = await UsersHelper.requestToGetWallFeedAsGuest(userJane);

    expect(posts.length).toBe(1);

    const [repost] = posts;

    expect(repost.id).toBe(repostId);

    const { post: postAutoUpdate } = repost;

    CommonChecker.expectNotEmpty(postAutoUpdate.json_data);
    expect(postAutoUpdate.id).toBe(postAutoUpdateId);
  });
});

describe('Get many posts with repost for feeds', () => {
  describe('Positive', () => {
    describe('For users wall', () => {
      it('Repost of user post wall list should have correct structure', async () => {
        const { repostId } = await PostsGenerator.createNewPostWithRepost(userJane, userVlad);

        const userOtherPostId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const posts = await UsersHelper.requestToGetWallFeedAsGuest(userVlad);

        const mediaPost = posts.find((post) => post.id === userOtherPostId);
        const repost = posts.find((post) => post.id === repostId);
        let options = CommonHelper.getOptionsForListAndGuest();

        options = {
          ...options,
          ...UsersHelper.propsAndCurrentParamsOptions(false),
        };

        PostsHelper.checkMediaPostFields(mediaPost, options);
        CommonHelper.checkOneRepostForList(repost, options, false);
      });
      it('Repost of user post ORG list should have correct structure', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userJane);
        const parentPostId = await PostsGenerator.createMediaPostOfOrganization(userJane, orgId);

        const userOtherPostId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const repostId = await PostsGenerator.createRepostOfUserPost(userVlad, parentPostId);

        const posts = await UsersHelper.requestToGetWallFeedAsGuest(userVlad);

        const mediaPost = posts.find((post) => post.id === userOtherPostId);
        const repost = posts.find((post) => post.id === repostId);
        let options = CommonHelper.getOptionsForListAndGuest();

        options = {
          ...options,
          ...UsersHelper.propsAndCurrentParamsOptions(false),
        };

        PostsHelper.checkMediaPostFields(mediaPost, options);
        CommonHelper.checkOneRepostForList(repost, options, true);
      });
    });

    describe('For users news feed', () => {
      it('News feed with repost of user himself post', async () => {
        const postsOwner       = userJane;
        const directPostAuthor = userVlad;

        const regularPostsAmount = 2;
        const postIds = await PostsGenerator.generateUsersPostsForUserWall(
          postsOwner,
          directPostAuthor,
          regularPostsAmount,
        );

        const userVladPostId  = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const janeRepostId    = await PostsGenerator.createRepostOfUserPost(userJane, userVladPostId);

        await ActivityHelper.requestToCreateFollow(userVlad, userJane);

        const posts = await UsersHelper.requestToGetMyselfNewsFeed(userVlad);

        expect(posts.length).toBe(regularPostsAmount * 3 + 2);

        const mediaPost = posts.find((post) => post.id === postIds[0]);
        const repost = posts.find((post) => post.id === janeRepostId);
        let options = CommonHelper.getOptionsForListAndMyself();

        options = {
          ...options,
          ...UsersHelper.propsAndCurrentParamsOptions(false),
        };

        PostsHelper.checkMediaPostFields(mediaPost, options);
        CommonHelper.checkOneRepostForList(repost, options, false);
      });

      it('News feed with repost of org post', async () => {
        const postsOwner       = userJane;
        const directPostAuthor = userVlad;

        const regularPostsAmount = 2;
        const postIds = await PostsGenerator.generateUsersPostsForUserWall(
          postsOwner,
          directPostAuthor,
          regularPostsAmount,
        );

        const vladOrgId     = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const vladOrgPostId = await PostsGenerator.createMediaPostOfOrganization(userVlad, vladOrgId);

        const janeRepostId  = await PostsGenerator.createRepostOfUserPost(userJane, vladOrgPostId);

        await ActivityHelper.requestToCreateFollow(userVlad, userJane);

        const posts = await UsersHelper.requestToGetMyselfNewsFeed(userVlad);

        expect(posts.length).toBe(regularPostsAmount * 3 + 1);

        const mediaPost = posts.find((post) => post.id === postIds[0]);
        const repost = posts.find((post) => post.id === janeRepostId);
        let options = CommonHelper.getOptionsForListAndMyself();

        options = {
          ...options,
          ...UsersHelper.propsAndCurrentParamsOptions(false),
        };
        PostsHelper.checkMediaPostFields(mediaPost, options);
        CommonHelper.checkOneRepostForList(repost, options, true);
      });
    });
  });
});

describe('GET one post', () => {
  describe('Positive', () => {
    it('Get one post-repost of users post by ID', async () => {
      const { repostId } = await PostsGenerator.createNewPostWithRepost(userJane, userVlad);

      const post = await PostsHelper.requestToGetOnePostAsGuest(repostId);

      const options = {
        myselfData    : false,
        postProcessing: 'list',
        ...UsersHelper.propsAndCurrentParamsOptions(false),
      };

      CommonHelper.checkOneRepostForList(post, options, false);
    });

    it('Get one post-repost of org post by ID', async () => {
      const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userJane);

      const parentPostId  = await PostsGenerator.createMediaPostOfOrganization(userJane, orgId);
      const repostId      = await PostsGenerator.createRepostOfUserPost(userVlad, parentPostId);

      const post = await PostsHelper.requestToGetOnePostAsGuest(repostId);

      const options = {
        myselfData    : false,
        postProcessing: 'list',
        ...UsersHelper.propsAndCurrentParamsOptions(false),
      };

      CommonHelper.checkOneRepostForList(post, options, true);
    });
  });
});

export {};
