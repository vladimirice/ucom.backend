export {};

const helpers = require('../helpers');
const gen     = require('../../generators');
const postsRepository = require('../../../lib/posts/repository');

const usersActivityRepository = require('../../../lib/users/repository').Activity;
const activityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
const postsModelProvider = require('../../../lib/posts/service/posts-model-provider');
const orgModelProvider = require('../../../lib/organizations/service').ModelProvider;

helpers.Mock.mockAllBlockchainPart();

let userVlad;
let userJane;
let userRokky;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, , userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
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
        // It is supposed that post offer blockchain creations have same logic

        const orgId   = await gen.Org.createOrgWithoutTeam(userVlad);
        const postId  = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);

        const newPost = await postsRepository.MediaPosts.findLastMediaPostByAuthor(userVlad.id);
        expect(newPost.organization_id).toBe(orgId);
        expect(newPost.id).toBe(postId);

        await helpers.Posts.expectPostDbValues(newPost, {
          entity_id_for:    `${orgId}`,
          entity_name_for:  orgModelProvider.getEntityName(),
        });
      });

      it('should create valid activity record', async () => {
        const user = userVlad;
        const orgId = 1;

        const body      = await helpers.Post.requestToCreateMediaPostOfOrganization(user, orgId);
        const activity  =
          await usersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, body.id);
        expect(activity).not.toBeNull();

        const expectedValues = {
          activity_type_id:   1, // media post creation
          activity_group_id:  activityGroupDictionary.getGroupContentCreationByOrganization(),
          entity_id_to:       `${body.id}`,
          entity_name:        postsModelProvider.getEntityName(),
          user_id_from:       user.id,
        };

        helpers.Res.expectValuesAreExpected(expectedValues, activity);
      });

      // tslint:disable-next-line:max-line-length
      it('should be possible to create post on behalf of organization by org team member', async () => {
        const orgId     = await gen.Org.createOrgWithTeam(userJane, [userVlad]);
        await helpers.Users.directlySetUserConfirmsInvitation(orgId, userVlad);

        const newPostId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgId);

        const newPost = await postsRepository.MediaPosts.findLastMediaPostByAuthor(userVlad.id);
        expect(newPost.organization_id).toBe(orgId);
        expect(newPost.user_id).toBe(userVlad.id);
        expect(newPost.id).toBe(newPostId);

        await helpers.Posts.expectPostDbValues(newPost, {
          entity_id_for:    `${orgId}`,
          entity_name_for:  orgModelProvider.getEntityName(),
        });
      });
    });

    describe('Negative scenarios', () => {
      // tslint:disable-next-line:max-line-length
      it('should not be possible to create post if you are not author or team member of campaign', async () => {
        const orgId = 1;

        // noinspection JSDeprecatedSymbols
        await helpers.Post.requestToCreateMediaPostOfOrganization(userRokky, orgId, 403);
      });

      it('should not be possible to create post by organization which does not exist', async () => {
        const orgId = 100500;

        // noinspection JSDeprecatedSymbols
        await helpers.Post.requestToCreateMediaPostOfOrganization(userVlad, orgId, 404);
      });

      // tslint:disable-next-line:max-line-length
      it('should NOT be possible to create post on behalf of organization by member with pending invitation', async () => {
        const orgId = 1;
        const user = userJane;

        // noinspection JSDeprecatedSymbols
        await helpers.Post.requestToCreateMediaPostOfOrganization(user, orgId, 403);
      });

      it.skip('should set organization_id = null for regular post creation', async () => {});
    });
  });

  describe('User updates post on behalf of organization', () => {
    // Positive scenarios are covered by post updating
    describe('Negative scenarios', () => {
      // tslint:disable-next-line:max-line-length
      it('should not be possible to update post by user who is not author but team member', async () => {
        const postId = 1;
        await helpers.Post.updatePostWithFields(postId, userJane, null, 404);
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should not be possible to update post and change or delete organization ID', async () => {
      });

      it.skip('should not be possible to update post and change author_id', async () => {
      });

    });
  });

  describe('User get one post created on behalf of his organization', () => {
    it('should contain myself member data if is got by org author', async () => {
      const userAuthor = userVlad;
      const postId = 1;

      const post = await helpers.Post.requestToGetOnePostAsMyself(postId, userAuthor);

      const myselfData = post.myselfData;
      expect(myselfData).toBeDefined();

      expect(myselfData.organization_member).toBeDefined();
      expect(myselfData.organization_member).toBeTruthy();
    });

    it('should contain myself member data if is got by org member', async () => {
      const orgId = await gen.Org.createOrgWithTeam(userJane, [userVlad]);
      const postId = await gen.Posts.createMediaPostOfOrganization(userJane, orgId);

      await helpers.Users.directlySetUserConfirmsInvitation(orgId, userVlad);

      const post = await helpers.Post.requestToGetOnePostAsMyself(postId, userVlad);

      const myselfData = post.myselfData;
      expect(myselfData).toBeDefined();

      expect(myselfData.organization_member).toBeDefined();
      expect(myselfData.organization_member).toBeTruthy();
    });

    describe('Negative', () => {
      it('should contain myself member false if invitation is still pending', async () => {
        const orgId = await gen.Org.createOrgWithTeam(userJane, [userVlad]);
        const postId = await gen.Posts.createMediaPostOfOrganization(userJane, orgId);

        const post = await helpers.Post.requestToGetOnePostAsMyself(postId, userVlad);

        const myselfData = post.myselfData;
        expect(myselfData).toBeDefined();

        expect(myselfData.organization_member).toBeDefined();
        expect(myselfData.organization_member).toBeFalsy();
      });
    });

    it('should contain myself member false if not belong to org', async () => {
      const user = userRokky;
      const postId = 1;

      const post = await helpers.Post.requestToGetOnePostAsMyself(postId, user);

      const myselfData = post.myselfData;
      expect(myselfData).toBeDefined();

      expect(myselfData.organization_member).toBeDefined();
      expect(myselfData.organization_member).toBeFalsy();
    });

  });

});
