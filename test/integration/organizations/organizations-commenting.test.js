const helpers = require('../helpers');
const PostsRepository = require('../../../lib/posts/repository');

const UsersActivityService = require('../../../lib/users/user-activity-service');
const UsersActivityRepository = require('../../../lib/users/repository').Activity;
const ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');


// noinspection JSUnusedLocalSymbols
UsersActivityService.createAndSignOrganizationCreatesPostTransaction = async function(
  userFrom,
  organizationBlockchainId,
  postBlockchainId,
  postTypeId
) {
  console.log('MOCK org create post sign is called');
  return 'sample_signed_transaction';
};


let userVlad;
let userJane;
let userPetr;
let userRokky;


helpers.Org.mockBlockchainPart();

describe('Organization members creates comments', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Get comments made by organization', () => {
    it('should add organization preview info if comment is made by organization member', async () => {
      const post_id = 1;

      await helpers.Seeds.bulkCreateComments();
      const post = await helpers.Post.requestToGetOnePostAsGuest(post_id);
      expect(post.comments.length).toBe(8);

      post.comments.forEach(comment => {
        if (comment.organization_id) {
          helpers.Org.checkOneOrganizationPreviewFields(comment.organization);
          // TODO - move to check preview fields - this is post-processing indicator
          expect(comment.organization.avatar_filename).toMatch('organizations/');
        }
      });
    });
  });

  describe('Direct comment creation', () => {
    describe('Positive scenarios', () => {
      it('should fill direct comment organization_id if is created by organization author', async () => {
        const post_id = 1; // post_id = 1 is belong to organization of author vlad
        const org_id  = 1;

        const body = await helpers.Comments.requestToCreateComment(post_id, userVlad);
        expect(body.organization_id).toBeDefined();
        expect(body.organization_id).toBe(org_id);

        helpers.Org.checkOneOrganizationPreviewFields(body.organization);
      });

      it('should fill comment on comment organization_id if is created by org team member in org post feed', async () => {
        const post_id = 1; // post_id = 1 is belong to organization of author vlad
        const org_id  = 1;

        const body = await helpers.Comments.requestToCreateComment(post_id, userJane);
        expect(body.organization_id).toBeDefined();
        expect(body.organization_id).toBe(org_id);

        expect(body.organization).toBeDefined();

        helpers.Org.checkOneOrganizationPreviewFields(body.organization);
      });
    });
    describe('Negative scenarios', () => {
      it('should not fill organization_id if comment author is not a org member', async () => {
        const post_id = 1; // post_id = 1 is belong to organization of author vlad

        const body = await helpers.Comments.requestToCreateComment(post_id, userRokky);
        expect(body.organization_id).toBeNull();
        expect(body.organization).toBeNull();
      });

      it('should not fill organization_id if comment author is not a org member but post is belong to org', async () => {
        // TODO
      });

      it('should not fill organization_id if post is not belong to any organization', async () => {
        // TODO
      });

      it('should not include organization info if does not belong to organization', async () => {
        // TODO
      });
    });
  });

  describe('Comment on comment creation', () => {
    describe('Positive scenarios', () => {
      it('should fill direct comment organization_id if is created by organization author', async () => {
        const post_id = 1; // post_id = 1 is belong to organization of author vlad
        const org_id  = 1;

        const parentComment = await helpers.Comments.requestToCreateComment(post_id, userRokky);

        const body = await helpers.Comments.requestToCreateCommentOnComment(post_id, parentComment.id, userVlad);
        expect(body.organization_id).toBeDefined();
        expect(body.organization_id).toBe(org_id);

        helpers.Org.checkOneOrganizationPreviewFields(body.organization);
      });

      it('should fill comment on comment organization_id if is created by org team member in org post feed', async () => {
        const post_id = 1; // post_id = 1 is belong to organization of author vlad
        const org_id  = 1;

        const parentComment = await helpers.Comments.requestToCreateComment(post_id, userRokky);

        const body = await helpers.Comments.requestToCreateCommentOnComment(post_id, parentComment.id, userJane);
        expect(body.organization_id).toBeDefined();
        expect(body.organization_id).toBe(org_id);

        expect(body.organization).toBeDefined();

        helpers.Org.checkOneOrganizationPreviewFields(body.organization);
      });
    });
    describe('Negative scenarios', () => {
      it('should not fill organization_id if comment author is not a org member', async () => {
        const post_id = 1; // post_id = 1 is belong to organization of author vlad

        const parentComment = await helpers.Comments.requestToCreateComment(post_id, userVlad);

        const body = await helpers.Comments.requestToCreateCommentOnComment(post_id, parentComment.id, userRokky);
        expect(body.organization_id).toBeNull();
        expect(body.organization).toBeNull();
      });

      it('should not fill organization_id if comment author is not a org member but post is belong to org', async () => {
        // TODO
      });

      it('should not fill organization_id if post is not belong to any organization', async () => {
        // TODO
      });

      it('should not include organization info if does not belong to organization', async () => {
        // TODO
      });
    });
  })

});