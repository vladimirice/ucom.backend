const expect  = require('expect');

const helpers = require('../helpers');
const gen = require('../../generators');

const PostsRepository         = require('../../../lib/posts/repository').MediaPosts;
const UsersActivityRepository = require('../../../lib/users/repository').Activity;

const ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
const ContentTypeDictionary   = require('uos-app-transaction').ContentTypeDictionary;

const PostsModelProvider      = require('../../../lib/posts/service').ModelProvider;

const EventIdDictionary = require('../../../lib/entities/dictionary').EventId;

let userVlad, userJane, userPetr, userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('Post repost API', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr, userRokky] = await Promise.all([
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

  describe('Create post-repost', function () {
    describe('Positive', () => {
      it('Create repost of user himself post', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;

        const postId = await gen.Posts.createMediaPostByUserHimself(parentPostAuthor);

        const parentPost = await PostsRepository.findOnlyPostItselfById(postId);
        expect(parentPost.parent_id).toBeDefined();
        expect(parentPost.parent_id).toBeNull();

        const repostId = await gen.Posts.createRepostOfUserPost(repostAuthor, postId);

        const repost = await PostsRepository.findOnlyPostItselfById(repostId);

        expect(repost.post_type_id).toBe(ContentTypeDictionary.getTypeRepost());
        expect(repost.title).toBeNull();
        expect(repost.parent_id).toBeDefined();
        expect(repost.parent_id).toBe(postId);

        const activity = await UsersActivityRepository.findLastByUserIdAndEntityId(repostAuthor.id, repostId);

        expect(activity.activity_type_id).toBe(ContentTypeDictionary.getTypeRepost());
        expect(activity.user_id_from).toBe(repostAuthor.id);
        expect(+activity.entity_id_to).toBe(+repostId);
        expect(activity.entity_name).toBe(PostsModelProvider.getEntityName());

        expect(activity.activity_group_id).toBe(ActivityGroupDictionary.getGroupContentCreation());
        expect(+activity.entity_id_on).toBe(postId);
        expect(activity.entity_name_on).toBe(PostsModelProvider.getEntityName());

        expect(activity.event_id).toBe(EventIdDictionary.getUserRepostsOtherUserPost());
      });

      it('create repost of organization post', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor     = userJane;

        const orgId = await gen.Org.createOrgWithoutTeam(parentPostAuthor);
        const postId = await gen.Posts.createMediaPostOfOrganization(parentPostAuthor, orgId);

        const repostId = await gen.Posts.createRepostOfUserPost(repostAuthor, postId);

        const activity = await UsersActivityRepository.findLastByUserIdAndEntityId(repostAuthor.id, repostId);

        expect(activity.event_id).toBe(EventIdDictionary.getUserRepostsOrgPost());
      });

      it('get list of posts with repost inside with different structure', async () => {

      });
    });

    describe('Negative', () => {
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

        await helpers.Posts.requestToPatchPostRepost(repostId, userVlad, 400)
      });
    });
  });
});