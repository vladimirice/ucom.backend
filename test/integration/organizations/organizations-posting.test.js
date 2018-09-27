const helpers = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');
const { ContentTypeDictionary } = require('uos-app-transaction');
const PostsRepository = require('../../../lib/posts/repository');
const request = require('supertest');
const server = require('../../../app');



let userVlad;
let userJane;
let userPetr;
let userRokky;


helpers.Org.mockBlockchainPart();

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

  describe('User creates post on behalf of organization', () => {
    describe('Positive scenarios', () => {
        it('should be possible to create media post on behalf of organization by org author', async () => {
          const user = userVlad;
          const org_id = 1;

          await helpers.Post.requestToCreateMediaPostOfOrganization(user, org_id);

          const newPost = await PostsRepository.MediaPosts.findLastMediaPostByAuthor(user.id);

          expect(newPost.organization_id).toBe(org_id);
        });

        it('should be possible to create media post on behalf of organization by org team member', async () => {



          // TODO
        });

        it('should be possible to create post-offer on behalf of organization by org author', async () => {
          // TODO
        });

        it('should be possible to create post-offer post on behalf of organization by org team member', async () => {
          // TODO
        });
    });

    describe('Negative scenarios', function () {
      it('should not be possible to create post if you are not author or team member of campaign', async () => {
        const user = userVlad;
        const org_id = await OrganizationsRepositories.Main.findLastIdByAuthor(userJane.id);

        await helpers.Post.requestToCreateMediaPostOfOrganization(user, org_id, 403);
      });

      it('should not be possible to create post by organization which does not exist', async () => {
        // TODO
      })
    });
  });

  describe('User updates post on behalf of organization', () => {
    // Positive scenarios are covered by post updating
    describe('Negative scenarios', () => {

      it('should not be possible to update post by user who is not author', async () => {
        // TODO
      });

      it('should not be possible to update post and change or delete organization ID', async () => {
        // TODO
      });

      it('should not be possible to update post and change author_id', async () => {
        // TODO - move to post autotests
      });

    });
  });

});