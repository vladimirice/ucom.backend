import MockHelper = require('../../helpers/mock-helper');
import UsersHelper = require('../../helpers/users-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import PostsHelper = require('../../helpers/posts-helper');
import CommonHelper = require('../../helpers/common-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsCurrentParamsRepository = require('../../../../lib/posts/repository/posts-current-params-repository');

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
      describe('Positive', () => {
        it('Post current params row should be created during post creation', async () => {
          const postId = await PostsGenerator.createDirectPostForUserAndGetId(userVlad, userJane);

          const data = await PostsCurrentParamsRepository.getCurrentStatsByEntityId(postId);

          PostsHelper.checkOneNewPostCurrentParams(data, true);
        });

        it('Create direct post for user without organization', async () => {
          const user = userVlad;
          const targetUser = userJane;

          const newPostFields: any = {
            description: 'Our super post description',
          };

          const expected = {
            entity_id_for: `${targetUser.id}`,
            entity_name_for: usersModelProvider.getEntityName(),
          };

          const post = await PostsGenerator.createUserDirectPostForOtherUserV2(
            user,
            targetUser,
            newPostFields.description,
          );

          const options = {
            myselfData: true,
            postProcessing: 'full',
            skipCommentsChecking: true,
          };

          await CommonHelper.checkOnePostForPage(post, options);

          await CommonHelper.checkDirectPostInDb(post, {
            ...expected,
            ...newPostFields,
          }, user);
        });

        it('Create direct post for organization without organization', async () => {
          const user = userVlad;
          const targetOrgId = 1;

          const newPostFields: any = {
            description: 'Our super post description',
          };

          const expected = {
            entity_id_for: `${targetOrgId}`,
            entity_name_for: orgModelProvider.getEntityName(),
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
          }, user);
        });
      });
    });

    describe('Update post', () => {
      describe('Positive', () => {
        describe('Update direct post', () => {
          it('Update direct post for user without organization', async () => {
            const user = userVlad;
            const targetUser = userJane;

            const expectedValues = {
              description: 'changed sample description of direct post',
            };

            // noinspection JSDeprecatedSymbols
            const postBefore =
              await PostsGenerator.createUserDirectPostForOtherUser(user, targetUser);
            const postAfter = await PostsHelper.requestToUpdatePostDescription(
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
            const user = userVlad;
            const targetOrgId = 1;

            const expectedValues = {
              description: 'changed sample description of direct post',
            };

            const postBefore =
              await PostsGenerator.createDirectPostForOrganizationV2(user, targetOrgId);
            const postAfter = await PostsHelper.requestToUpdatePostDescription(
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
});
