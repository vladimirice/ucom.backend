const expect = require('expect');

const helpers = require('../../helpers');
const gen     = require('../../../generators');

const UserHelper      = helpers.UserHelper;
const SeedsHelper     = helpers.Seeds;

const UsersModelProvider      = require('../../../../lib/users/service').ModelProvider;
const OrgModelProvider        = require('../../../../lib/organizations/service').ModelProvider;

let userVlad, userJane;

helpers.Mock.mockAllBlockchainPart();

describe('Direct posts create-update', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane()
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
      it('Create direct post with picture', async () => {
        const post = await gen.Posts.createUserDirectPostForOtherUser(userVlad, userJane, null, true);
        expect(post.main_image_filename).toBeDefined();

        await helpers.FileToUpload.isFileUploaded(post.main_image_filename);
      });

      it('Create direct post for org with picture', async () => {
        const orgId = await gen.Org.createOrgWithoutTeam(userJane);

        const post = await gen.Posts.createDirectPostForOrganization(userVlad, orgId, null, true);
        expect(post.main_image_filename).toBeDefined();

        await helpers.FileToUpload.isFileUploaded(post.main_image_filename);
      });
      it('For User without organization', async () => {
        const user = userVlad;
        const targetUser = userJane;

        const newPostFields = {
          description: 'Our super post description',
        };

        const expected = {
          'entity_id_for':    "" + targetUser.id,
          'entity_name_for':  UsersModelProvider.getEntityName(),
        };

        // noinspection JSDeprecatedSymbols
        const post = await helpers.Posts.requestToCreateDirectPostForUser(user, targetUser, newPostFields.description);

        const options = {
          myselfData: true,
          postProcessing: 'full'
        };

        await helpers.Common.checkOnePostForPage(post, options);

        await helpers.Common.checkDirectPostInDb(post, {
          ...expected,
          ...newPostFields
        }, user);
      });
      it('For organization without organization', async () => {
        const user = userVlad;
        const targetOrgId = 1;

        const newPostFields = {
          description: 'Our super post description',
        };

        const expected = {
          'entity_id_for':    "" + targetOrgId,
          'entity_name_for':  OrgModelProvider.getEntityName(),
        };

        // noinspection JSDeprecatedSymbols
        const post = await helpers.Posts.requestToCreateDirectPostForOrganization(user, targetOrgId, newPostFields.description);

        const options = {
          myselfData: true,
          postProcessing: 'full'
        };

        await helpers.Common.checkOnePostForPage(post, options);
        await helpers.Common.checkDirectPostInDb(post, {
          ...expected,
          ...newPostFields
        }, user);
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
            description: 'changed sample description of direct post'
          };

          // noinspection JSDeprecatedSymbols
          const postBefore  = await helpers.Posts.requestToCreateDirectPostForUser(user, targetUser);
          const postAfter   = await helpers.Posts.requestToUpdatePostDescription(postBefore.id, user, expectedValues.description);

          const options = {
            myselfData: true,
            postProcessing: 'full'
          };

          await helpers.Common.checkOnePostForPage(postAfter, options);
          await helpers.Common.checkDirectPostInDb(postAfter, expectedValues, userVlad);
        });

        it('Update direct post for organization without organization', async () => {
          const user          = userVlad;
          const targetOrgId   = 1;

          const expectedValues = {
            description: 'changed sample description of direct post'
          };

          // noinspection JSDeprecatedSymbols
          const postBefore  = await helpers.Posts.requestToCreateDirectPostForOrganization(user, targetOrgId);
          const postAfter   = await helpers.Posts.requestToUpdatePostDescription(postBefore.id, user, expectedValues.description);

          const options = {
            myselfData: true,
            postProcessing: 'full'
          };

          await helpers.Common.checkOnePostForPage(postAfter, options);
          await helpers.Common.checkDirectPostInDb(postAfter, expectedValues, userVlad);
        });
      });
    });
  });

  describe('Skipped tests', () => {
    it.skip('Direct post. Not possible to change entity_id_for and entity_name_for by request', async () => {
    });
    it.skip('not possible to create direct post as regular post', async () => {
    });


  });
});