import SeedsHelper = require('../../helpers/seeds-helper');
import CommonHelper = require('../../helpers/common-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsHelper = require('../../helpers/posts-helper');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import OrganizationsModelProvider = require('../../../../lib/organizations/service/organizations-model-provider');

describe('Direct posts create-update v2', () => {
  let userVlad;
  let userJane;

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Direct post creation v2', () => {
    it('Create direct post for user without organization', async () => {
      const user = userVlad;
      const targetUser = userJane;

      const newPostFields: any = {
        description: 'Our super post description',
      };

      const expected = {
        entity_id_for:    `${targetUser.id}`,
        entity_name_for:  UsersModelProvider.getEntityName(),
      };

      const post = await PostsGenerator.createUserDirectPostForOtherUserV2(
        user,
        targetUser,
        newPostFields.description,
      );

      const options = {
        myselfData: true,
        postProcessing: 'full',
        allowEmptyComments: true,
      };

      await CommonHelper.checkOnePostForPageV2(post, options);

      await CommonHelper.checkDirectPostInDb(post, {
        ...expected,
        ...newPostFields,
      },                                       user);
    });

    it('Create direct post for organization', async () => {
      const user = userVlad;

      const targetOrgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      const newPostFields: any = {
        description: 'Our super post description',
      };

      const expected = {
        entity_id_for:    `${targetOrgId}`,
        entity_name_for:  OrganizationsModelProvider.getEntityName(),
      };

      const post = await PostsGenerator.createDirectPostForOrganizationV2(
        userVlad,
        targetOrgId,
        newPostFields.description,
      );

      const options = {
        myselfData: true,
        postProcessing: 'full',
        allowEmptyComments: true,
      };

      await CommonHelper.checkOnePostForPageV2(post, options);

      await CommonHelper.checkDirectPostInDb(post, {
        ...expected,
        ...newPostFields,
      },                                       user);
    });
  });

  describe('Direct post updating v2', () => {
    it('Update direct post for user without organization', async () => {
      const user        = userVlad;
      const targetUser  = userJane;

      const expectedValues = {
        description: 'changed sample description of direct post',
      };

      // noinspection JSDeprecatedSymbols
      const postBefore  =
        await PostsGenerator.createUserDirectPostForOtherUserV2(user, targetUser);
      const postAfter   = await PostsHelper.requestToUpdatePostDescriptionV2(
        postBefore.id,
        user,
        expectedValues.description,
      );

      const options = {
        myselfData: true,
        postProcessing: 'full',
        skipCommentsChecking: true,
      };

      expect(postAfter.comments).not.toBeDefined();


      await CommonHelper.checkOnePostForPage(postAfter, options);
      await CommonHelper.checkDirectPostInDb(postAfter, expectedValues, userVlad);
    });
  });
});

export {};
