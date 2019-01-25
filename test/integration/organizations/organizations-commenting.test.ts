import SeedsHelper = require('../helpers/seeds-helper');
import CommentsHelper = require('../helpers/comments-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');
import UsersHelper = require('../helpers/users-helper');
import CommentsGenerator = require('../../generators/comments-generator');

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('Organization members creates comments', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine(true);
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Direct comment creation', () => {
    describe('Positive scenarios', () => {
      // tslint:disable-next-line:max-line-length
      it('should fill direct comment organization_id if is created by organization author', async () => {
        const postId = 1; // post_id = 1 is belong to organization of author vlad
        const orgId  = 1;

        // noinspection JSDeprecatedSymbols
        const body = await CommentsHelper.requestToCreateComment(postId, userVlad);
        expect(body.organization_id).toBeDefined();
        expect(body.organization_id).toBe(orgId);

        OrganizationsHelper.checkOneOrganizationPreviewFields(body.organization);
      });

      // tslint:disable-next-line:max-line-length
      it('should fill comment organization_id if is created by org team member in org post feed', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithTeam(userJane, [
          userVlad, userPetr,
        ]);

        const postId = await PostsGenerator.createMediaPostOfOrganization(userJane, orgId);
        await UsersHelper.directlySetUserConfirmsInvitation(orgId, userVlad);

        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        expect(comment.organization_id).toBeDefined();
        expect(comment.organization_id).not.toBeNull();
        expect(comment.organization_id).toBe(postId);

        expect(comment.organization).toBeDefined();
        expect(comment.organization).not.toBeNull();

        OrganizationsHelper.checkOneOrganizationPreviewFields(comment.organization);
      });
    });
    describe('Negative scenarios', () => {
      it('should not fill organization_id if comment author is not a org member', async () => {
        const postId = 1; // post_id = 1 is belong to organization of author vlad

        // noinspection JSDeprecatedSymbols
        const body = await CommentsGenerator.createCommentForPost(postId, userRokky);
        expect(body.organization_id).toBeNull();
        expect(body.organization).toBeNull();
      });

      // tslint:disable-next-line:max-line-length
      it('should NOT fill organization_id if comment author has invitation with not-confirmed status', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithTeam(userJane, [
          userVlad, userPetr,
        ]);

        const postId = await PostsGenerator.createMediaPostOfOrganization(userJane, orgId);

        // noinspection JSDeprecatedSymbols
        const body = await CommentsHelper.requestToCreateComment(postId, userVlad);
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
        const parentComment = await CommentsHelper.requestToCreateComment(postId, userRokky);

        // noinspection JSDeprecatedSymbols
        const body = await CommentsHelper.requestToCreateCommentOnComment(
          postId,
          parentComment.id,
          userVlad,
        );
        expect(body.organization_id).toBeDefined();
        expect(body.organization_id).toBe(orgId);

        OrganizationsHelper.checkOneOrganizationPreviewFields(body.organization);
      });

      // tslint:disable-next-line:max-line-length
      it('should fill comment on comment organization_id if is created by org team member in org post feed', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithTeam(userJane, [
          userVlad, userPetr,
        ]);

        const postId        = await PostsGenerator.createMediaPostOfOrganization(userJane, orgId);
        const parentComment = await CommentsGenerator.createCommentForPost(postId, userJane);

        await UsersHelper.directlySetUserConfirmsInvitation(orgId, userVlad);

        const comment =
          await CommentsGenerator.createCommentOnComment(postId, parentComment.id, userVlad);
        expect(comment.organization_id).toBeDefined();
        expect(comment.organization_id).toBe(orgId);

        expect(comment.organization).toBeDefined();

        OrganizationsHelper.checkOneOrganizationPreviewFields(comment.organization);
      });
    });
    describe('Negative scenarios', () => {
      it('should not fill organization_id if comment author is not a org member', async () => {
        const postId = 1; // post_id = 1 is belong to organization of author vlad

        // noinspection JSDeprecatedSymbols
        const parentComment = await CommentsHelper.requestToCreateComment(postId, userVlad);

        // noinspection JSDeprecatedSymbols
        const body = await CommentsHelper.requestToCreateCommentOnComment(
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

export {};
