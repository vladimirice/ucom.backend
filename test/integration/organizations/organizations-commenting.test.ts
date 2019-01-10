export {};

const helpers = require('../helpers');
const gen     = require('../../generators');

helpers.Mock.mockAllBlockchainPart();

let userVlad;
let userJane;
let userPetr;
let userRokky;

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

  describe('Direct comment creation', () => {
    describe('Positive scenarios', () => {
      // tslint:disable-next-line:max-line-length
      it('should fill direct comment organization_id if is created by organization author', async () => {
        const postId = 1; // post_id = 1 is belong to organization of author vlad
        const orgId  = 1;

        // noinspection JSDeprecatedSymbols
        const body = await helpers.Comments.requestToCreateComment(postId, userVlad);
        expect(body.organization_id).toBeDefined();
        expect(body.organization_id).toBe(orgId);

        helpers.Org.checkOneOrganizationPreviewFields(body.organization);
      });

      // tslint:disable-next-line:max-line-length
      it('should fill comment organization_id if is created by org team member in org post feed', async () => {
        const orgId = await gen.Org.createOrgWithTeam(userJane, [
          userVlad, userPetr,
        ]);

        const postId = await gen.Posts.createMediaPostOfOrganization(userJane, orgId);
        await helpers.Users.directlySetUserConfirmsInvitation(orgId, userVlad);

        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        expect(comment.organization_id).toBeDefined();
        expect(comment.organization_id).not.toBeNull();
        expect(comment.organization_id).toBe(postId);

        expect(comment.organization).toBeDefined();
        expect(comment.organization).not.toBeNull();

        helpers.Org.checkOneOrganizationPreviewFields(comment.organization);
      });
    });
    describe('Negative scenarios', () => {
      it('should not fill organization_id if comment author is not a org member', async () => {
        const postId = 1; // post_id = 1 is belong to organization of author vlad

        // noinspection JSDeprecatedSymbols
        const body = await helpers.Comments.requestToCreateComment(postId, userRokky);
        expect(body.organization_id).toBeNull();
        expect(body.organization).toBeNull();
      });

      // tslint:disable-next-line:max-line-length
      it('should NOT fill organization_id if comment author has invitation with not-confirmed status', async () => {
        const orgId = await gen.Org.createOrgWithTeam(userJane, [
          userVlad, userPetr,
        ]);

        const postId = await gen.Posts.createMediaPostOfOrganization(userJane, orgId);

        // noinspection JSDeprecatedSymbols
        const body = await helpers.Comments.requestToCreateComment(postId, userVlad);
        expect(body.organization_id).toBeNull();

        expect(body.organization).toBeNull();
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should not fill organization_id if comment author is not a org member but post is belong to org', async () => {
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should not fill organization_id if post is not belong to any organization', async () => {
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should not include organization info if does not belong to organization', async () => {
      });
    });
  });

  describe('Comment on comment creation', () => {
    describe('Positive scenarios', () => {
      // tslint:disable-next-line:max-line-length
      it('should fill direct comment organization_id if is created by organization author', async () => {
        const postId = 1; // post_id = 1 is belong to organization of author vlad
        const orgId  = 1;

        // noinspection JSDeprecatedSymbols
        const parentComment = await helpers.Comments.requestToCreateComment(postId, userRokky);

        // noinspection JSDeprecatedSymbols
        const body = await helpers.Comments.requestToCreateCommentOnComment(
          postId,
          parentComment.id,
          userVlad,
        );
        expect(body.organization_id).toBeDefined();
        expect(body.organization_id).toBe(orgId);

        helpers.Org.checkOneOrganizationPreviewFields(body.organization);
      });

      // tslint:disable-next-line:max-line-length
      it('should fill comment on comment organization_id if is created by org team member in org post feed', async () => {
        const orgId = await gen.Org.createOrgWithTeam(userJane, [
          userVlad, userPetr,
        ]);

        const postId        = await gen.Posts.createMediaPostOfOrganization(userJane, orgId);
        const parentComment = await gen.Comments.createCommentForPost(postId, userJane);

        await helpers.Users.directlySetUserConfirmsInvitation(orgId, userVlad);

        const comment =
          await gen.Comments.createCommentOnComment(postId, parentComment.id, userVlad);
        expect(comment.organization_id).toBeDefined();
        expect(comment.organization_id).toBe(orgId);

        expect(comment.organization).toBeDefined();

        helpers.Org.checkOneOrganizationPreviewFields(comment.organization);
      });
    });
    describe('Negative scenarios', () => {
      it('should not fill organization_id if comment author is not a org member', async () => {
        const postId = 1; // post_id = 1 is belong to organization of author vlad

        // noinspection JSDeprecatedSymbols
        const parentComment = await helpers.Comments.requestToCreateComment(postId, userVlad);

        // noinspection JSDeprecatedSymbols
        const body = await helpers.Comments.requestToCreateCommentOnComment(
          postId,
          parentComment.id,
          userRokky,
        );
        expect(body.organization_id).toBeNull();
        expect(body.organization).toBeNull();
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should NOT fill organization_id if comment author has invitation with not-confirmed status', async () => {
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should not fill organization_id if comment author is not a org member but post is belong to org', async () => {
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should not fill organization_id if post is not belong to any organization', async () => {
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should not include organization info if does not belong to organization', async () => {
      });
    });
  });
});
