const helpers = require('../helpers');
const PostsRepository = require('../../../lib/posts/repository');

const UsersActivityRepository = require('../../../lib/users/repository').Activity;
const ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
const PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');


helpers.Mock.mockPostTransactionSigning();
helpers.Mock.mockBlockchainPart();

let userVlad, userJane, userPetr, userRokky;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organization creates post.', () => {
    describe('Positive scenarios', () => {
        it('should be possible to create post on behalf of organization by org author', async () => {
          // It is supposed that media post and post offer blockchain creations have same logic
          const user = userVlad;
          const org_id = 1;

          await helpers.Post.requestToCreateMediaPostOfOrganization(user, org_id);

          const newPost = await PostsRepository.MediaPosts.findLastMediaPostByAuthor(user.id);
          expect(newPost.organization_id).toBe(org_id);
        });

      it('should create valid activity record', async () => {
        const user = userVlad;
        const org_id = 1;

        const body      = await helpers.Post.requestToCreateMediaPostOfOrganization(user, org_id);
        const activity  = await UsersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, body.id);
        expect(activity).not.toBeNull();

        const expectedValues = {
          activity_type_id:   1, // media post creation
          activity_group_id:  ActivityGroupDictionary.getGroupContentCreationByOrganization(),
          entity_id_to:       "" + body.id,
          entity_name:        PostsModelProvider.getEntityName(),
          user_id_from:       user.id
        };

        helpers.Res.expectValuesAreExpected(expectedValues, activity);
      });

      it('should be possible to create post on behalf of organization by org team member', async () => {
        const org_id = 1;
        const user = userJane;

        await helpers.Post.requestToCreateMediaPostOfOrganization(user, org_id);

        const newPost = await PostsRepository.MediaPosts.findLastMediaPostByAuthor(user.id);
        expect(newPost.organization_id).toBe(org_id);
        expect(newPost.user_id).toBe(userJane.id);
      });
    });

    describe('Negative scenarios', function () {
      it('should not be possible to create post if you are not author or team member of campaign', async () => {
        const org_id = 1;

        await helpers.Post.requestToCreateMediaPostOfOrganization(userRokky, org_id, 403);
      });

      it('should not be possible to create post by organization which does not exist', async () => {
        const org_id = 100500;

        await helpers.Post.requestToCreateMediaPostOfOrganization(userVlad, org_id, 404);
      });

      it('should set organization_id = null for regular post creation', async () => {
        // TODO
      });
    });
  });

  describe('User updates post on behalf of organization', () => {
    // Positive scenarios are covered by post updating
    describe('Negative scenarios', () => {
      it('should not be possible to update post by user who is not author but team member', async () => {
        const post_id = 1;
        await helpers.Post.updatePostWithFields(post_id, userJane, null, 404);
      });

      it('should not be possible to update post and change or delete organization ID', async () => {
        // TODO
      });

      it('should not be possible to update post and change author_id', async () => {
        // TODO - move to post autotests
      });

    });
  });

  describe('User get one post created on behalf of his organization', () => {
    it('should contain myself member data if is got by org author', async () => {
      const userAuthor = userVlad;
      const post_id = 1;

      const post = await helpers.Post.requestToGetOnePostAsMyself(post_id, userAuthor);

      const myselfData = post.myselfData;
      expect(myselfData).toBeDefined();

      expect(myselfData.organization_member).toBeDefined();
      expect(myselfData.organization_member).toBeTruthy();
    });

    it('should contain myself member data if is got by org member', async () => {
      const userAuthor = userJane;
      const post_id = 1;

      const post = await helpers.Post.requestToGetOnePostAsMyself(post_id, userAuthor);

      const myselfData = post.myselfData;
      expect(myselfData).toBeDefined();

      expect(myselfData.organization_member).toBeDefined();
      expect(myselfData.organization_member).toBeTruthy();
    });

    it('should contain myself member false if not belong to org', async () => {
      const user = userRokky;
      const post_id = 1;

      const post = await helpers.Post.requestToGetOnePostAsMyself(post_id, user);

      const myselfData = post.myselfData;
      expect(myselfData).toBeDefined();

      expect(myselfData.organization_member).toBeDefined();
      expect(myselfData.organization_member).toBeFalsy();
    });
  });

});