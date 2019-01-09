export {};

const expect  = require('expect');

const helpers = require('../../helpers');
const gen = require('../../../generators');

const postsRepository         = require('../../../../lib/posts/repository').MediaPosts;
const usersActivityRepository = require('../../../../lib/users/repository').Activity;

const activityGroupDictionary = require('../../../../lib/activity/activity-group-dictionary');
const ContentTypeDictionary   = require('ucom-libs-social-transactions').ContentTypeDictionary;

const postsModelProvider      = require('../../../../lib/posts/service').ModelProvider;

const eventIdDictionary = require('../../../../lib/entities/dictionary').EventId;

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

  describe('Create post-repost', () => {
    describe('Positive', () => {
      it('Create repost of user himself post', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;

        const postId = await gen.Posts.createMediaPostByUserHimself(parentPostAuthor);

        const parentPost = await postsRepository.findOnlyPostItselfById(postId);
        expect(parentPost.parent_id).toBeDefined();
        expect(parentPost.parent_id).toBeNull();

        const repostId = await gen.Posts.createRepostOfUserPost(repostAuthor, postId);

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

        const orgId = await gen.Org.createOrgWithoutTeam(parentPostAuthor);
        const postId = await gen.Posts.createMediaPostOfOrganization(parentPostAuthor, orgId);

        const repostId = await gen.Posts.createRepostOfUserPost(repostAuthor, postId);

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

        const postId = await gen.Posts.createMediaPostByUserHimself(parentPostAuthor);
        await gen.Posts.createRepostOfUserPost(repostAuthor, postId);

        await gen.Posts.createRepostOfUserPost(repostAuthor, postId, 400);
      });

      it('not possible to repost the same org post twice by the same user', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor     = userJane;

        const orgId   = await gen.Org.createOrgWithoutTeam(parentPostAuthor);
        const postId  = await gen.Posts.createMediaPostOfOrganization(parentPostAuthor, orgId);

        await gen.Posts.createRepostOfUserPost(repostAuthor, postId);
        await gen.Posts.createRepostOfUserPost(repostAuthor, postId, 400);
      });

      it.skip('not possible to repost your own post', async () => {
        // TODO
      });

      it.skip('not possible to repost post-repost', async () => {
        // TODO
      });

      it.skip('not possible to repost not existed post', async () => {
        // TODO
      });

      it.skip('not possible to repost direct post made on yours wall', async () => {
        // TODO
      });
    });
  });

  describe('Update post-repost', () => {
    describe('Negative', () => {
      it('It is not possible to patch post-repost', async () => {

        const parentPostId  = await gen.Posts.createMediaPostByUserHimself(userJane);
        const repostId      = await gen.Posts.createRepostOfUserPost(userVlad, parentPostId);

        await helpers.Posts.requestToPatchPostRepost(repostId, userVlad, 400);
      });
    });
  });
});
