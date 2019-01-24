import MockHelper = require('../../helpers/mock-helper');
import UsersHelper = require('../../helpers/users-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import PostsHelper = require('../../helpers/posts-helper');
import CommonHelper = require('../../helpers/common-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import FileToUploadHelper = require('../../helpers/file-to-upload-helper');
import OrganizationsGenerator = require('../../../generators/organizations-generator');

export {};

const usersModelProvider      = require('../../../../lib/users/service').ModelProvider;
const orgModelProvider        = require('../../../../lib/organizations/service').ModelProvider;

let userVlad;
let userJane;

MockHelper.mockAllBlockchainPart();

describe('Direct posts create-update', () => {
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

  describe('Direct post creation', () => {
    describe('Positive', () => {
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

        // noinspection JSDeprecatedSymbols
        const post = await PostsHelper.requestToCreateDirectPostForUser(
          user,
          targetUser,
          newPostFields.description,
        );

        const options = {
          myselfData: true,
          postProcessing: 'full',
        };

        await CommonHelper.checkOnePostForPage(post, options);

        await CommonHelper.checkDirectPostInDb(post, {
          ...expected,
          ...newPostFields,
        },                                       user);
      });

      it('Create direct post for organization without organization', async () => {
        const user = userVlad;
        const targetOrgId = 1;

        const newPostFields: any = {
          description: 'Our super post description',
        };

        const expected = {
          entity_id_for:    `${targetOrgId}`,
          entity_name_for:  orgModelProvider.getEntityName(),
        };

        // noinspection JSDeprecatedSymbols
        const post = await PostsHelper.requestToCreateDirectPostForOrganization(
          user,
          targetOrgId,
          newPostFields.description,
        );

        const options = {
          myselfData: true,
          postProcessing: 'full',
        };

        await CommonHelper.checkOnePostForPage(post, options);
        await CommonHelper.checkDirectPostInDb(post, {
          ...expected,
          ...newPostFields,
        },                                       user);
      });

      it('Create direct post with picture', async () => {
        const post =
          await PostsGenerator.createUserDirectPostForOtherUser(userVlad, userJane, null, true);
        expect(post.main_image_filename).toBeDefined();

        await FileToUploadHelper.isFileUploaded(post.main_image_filename);
      });

      it('Create direct post for org with picture', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userJane);

        const post = await PostsGenerator.createDirectPostForOrganization(
          userVlad,
          orgId,
          null,
          true,
        );

        expect(post.main_image_filename).toBeDefined();

        await FileToUploadHelper.isFileUploaded(post.main_image_filename);
      });
    });
  });

  describe('Update post', () => {
    describe('Positive', () => {
      describe('Update direct post', () => {
        it('Update direct post for user without organization', async () => {
          const user        = userVlad;
          const targetUser  = userJane;

          const expectedValues = {
            description: 'changed sample description of direct post',
          };

          // noinspection JSDeprecatedSymbols
          const postBefore  =
            await PostsHelper.requestToCreateDirectPostForUser(user, targetUser);
          const postAfter   = await PostsHelper.requestToUpdatePostDescription(
            postBefore.id,
            user,
            expectedValues.description,
          );

          const options = {
            myselfData: true,
            postProcessing: 'full',
          };

          await CommonHelper.checkOnePostForPage(postAfter, options);
          await CommonHelper.checkDirectPostInDb(postAfter, expectedValues, userVlad);
        });

        it('Update direct post for organization without organization', async () => {
          const user          = userVlad;
          const targetOrgId   = 1;

          const expectedValues = {
            description: 'changed sample description of direct post',
          };

          // noinspection JSDeprecatedSymbols
          const postBefore  =
            await PostsHelper.requestToCreateDirectPostForOrganization(user, targetOrgId);
          const postAfter   = await PostsHelper.requestToUpdatePostDescription(
            postBefore.id,
            user,
            expectedValues.description,
          );

          const options = {
            myselfData: true,
            postProcessing: 'full',
          };

          await CommonHelper.checkOnePostForPage(postAfter, options);
          await CommonHelper.checkDirectPostInDb(postAfter, expectedValues, userVlad);
        });
      });
    });
  });

  describe('Skipped tests', () => {
    // tslint:disable-next-line:max-line-length
    it.skip('Direct post. Not possible to change entity_id_for and entity_name_for by request', async () => {
    });
    it.skip('not possible to create direct post as regular post', async () => {
    });
  });
});
