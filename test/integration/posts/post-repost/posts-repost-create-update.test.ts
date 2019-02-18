import MockHelper = require('../../helpers/mock-helper');
import UsersHelper = require('../../helpers/users-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import PostsHelper = require('../../helpers/posts-helper');
import PostsCurrentParamsRepository = require('../../../../lib/posts/repository/posts-current-params-repository');

const expect  = require('expect');

const { ContentTypeDictionary }   = require('ucom-libs-social-transactions');

const postsRepository         = require('../../../../lib/posts/repository').MediaPosts;

const usersActivityRepository = require('../../../../lib/users/repository').Activity;
const activityGroupDictionary = require('../../../../lib/activity/activity-group-dictionary');

const postsModelProvider      = require('../../../../lib/posts/service').ModelProvider;

const eventIdDictionary = require('../../../../lib/entities/dictionary').EventId;

let userVlad;
let userJane;

MockHelper.mockAllBlockchainPart();

describe('Post repost API', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      UsersHelper.getUserVlad(),
      UsersHelper.getUserJane(),
      UsersHelper.getUserPetr(),
      UsersHelper.getUserRokky(),
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initUsersOnly();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Create post-repost', () => {
    describe('Positive', () => {
      it('Post of user himself - current params row should be created during post creation', async () => {
        const { postId, repostId } = await PostsGenerator.createUserPostAndRepost(userVlad, userJane);

        const postData = await PostsCurrentParamsRepository.getPostCurrentStatsByPostId(postId);
        const repostData = await PostsCurrentParamsRepository.getPostCurrentStatsByPostId(repostId);

        PostsHelper.checkOneNewPostCurrentParams(postData, true);
        PostsHelper.checkOneNewPostCurrentParams(repostData, true);
      });

      it('Post of org - current params row should be created during post creation', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

        const repostId = await PostsGenerator.createRepostOfUserPost(userJane, postId);

        const postData = await PostsCurrentParamsRepository.getPostCurrentStatsByPostId(postId);
        const repostData = await PostsCurrentParamsRepository.getPostCurrentStatsByPostId(repostId);

        PostsHelper.checkOneNewPostCurrentParams(postData, true);
        PostsHelper.checkOneNewPostCurrentParams(repostData, true);
      });

      it('Create repost of user himself post', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;

        const postId = await PostsGenerator.createMediaPostByUserHimself(parentPostAuthor);

        const parentPost = await postsRepository.findOnlyPostItselfById(postId);
        expect(parentPost.parent_id).toBeDefined();
        expect(parentPost.parent_id).toBeNull();

        const repostId = await PostsGenerator.createRepostOfUserPost(repostAuthor, postId);

        const repost = await postsRepository.findOnlyPostItselfById(repostId);

        expect(repost.post_type_id).toBe(ContentTypeDictionary.getTypeRepost());
        expect(repost.title).toBeNull();
        expect(repost.parent_id).toBeDefined();
        expect(repost.parent_id).toBe(postId);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(repostAuthor.id, repostId);

        expect(activity.activity_type_id).toBe(ContentTypeDictionary.getTypeRepost());
        expect(activity.user_id_from).toBe(repostAuthor.id);
        expect(+activity.entity_id_to).toBe(+repostId);
        expect(activity.entity_name).toBe(postsModelProvider.getEntityName());

        expect(activity.activity_group_id).toBe(activityGroupDictionary.getGroupContentCreation());
        expect(+activity.entity_id_on).toBe(postId);
        expect(activity.entity_name_on).toBe(postsModelProvider.getEntityName());

        expect(activity.event_id).toBe(eventIdDictionary.getUserRepostsOtherUserPost());
      });

      it('create repost of organization post', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor     = userJane;

        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(parentPostAuthor);
        const postId = await PostsGenerator.createMediaPostOfOrganization(parentPostAuthor, orgId);

        const repostId = await PostsGenerator.createRepostOfUserPost(repostAuthor, postId);

        const activity =
          await usersActivityRepository.findLastByUserIdAndEntityId(repostAuthor.id, repostId);

        expect(activity.event_id).toBe(eventIdDictionary.getUserRepostsOrgPost());
      });

      it.skip('get list of posts with repost inside with different structure', async () => {

      });
    });

    describe('Negative', () => {
      it('not possible to repost the same post twice by the same user', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;

        const postId = await PostsGenerator.createMediaPostByUserHimself(parentPostAuthor);
        await PostsGenerator.createRepostOfUserPost(repostAuthor, postId);

        await PostsGenerator.createRepostOfUserPost(repostAuthor, postId, 400);
      });

      it('not possible to repost the same org post twice by the same user', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor     = userJane;

        const orgId   = await OrganizationsGenerator.createOrgWithoutTeam(parentPostAuthor);
        const postId  = await PostsGenerator.createMediaPostOfOrganization(parentPostAuthor, orgId);

        await PostsGenerator.createRepostOfUserPost(repostAuthor, postId);
        await PostsGenerator.createRepostOfUserPost(repostAuthor, postId, 400);
      });

      it.skip('not possible to repost your own post', async () => {
      });

      it.skip('not possible to repost post-repost', async () => {
      });

      it.skip('not possible to repost not existed post', async () => {
      });

      it.skip('not possible to repost direct post made on yours wall', async () => {
      });
    });
  });

  describe('Update post-repost', () => {
    describe('Negative', () => {
      it('It is not possible to patch post-repost', async () => {
        const parentPostId  = await PostsGenerator.createMediaPostByUserHimself(userJane);
        const repostId      = await PostsGenerator.createRepostOfUserPost(userVlad, parentPostId);

        await PostsHelper.requestToPatchPostRepost(repostId, userVlad, 400);
      });
    });
  });
});

export {};
