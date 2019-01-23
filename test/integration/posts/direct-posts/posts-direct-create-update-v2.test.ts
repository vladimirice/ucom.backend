import MockHelper = require('../../helpers/mock-helper');
import UsersHelper = require('../../helpers/users-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import CommonHelper = require('../../helpers/common-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsHelper = require('../../helpers/posts-helper');

const usersModelProvider      = require('../../../../lib/users/service').ModelProvider;

let userVlad;
let userJane;

MockHelper.mockAllBlockchainPart();

describe('Direct posts create-update v2', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      UsersHelper.getUserVlad(),
      UsersHelper.getUserJane(),
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initPostOfferSeeds();
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
        entity_name_for:  usersModelProvider.getEntityName(),
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
