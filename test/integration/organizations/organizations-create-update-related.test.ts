import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { OrgModelResponse } from '../../../lib/organizations/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');

import OrganizationsHelper = require('../helpers/organizations-helper');
import CommonHelper = require('../helpers/common-helper');
import EntityResponseState = require('../../../lib/common/dictionary/EntityResponseState');
import UsersHelper = require('../helpers/users-helper');
import ResponseHelper = require('../helpers/response-helper');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 5000;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

describe('Organizations create,update related entities', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => { [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(); });

  describe('Validate one discussion', () => {
    describe('Positive', () => {
      it('check validation - should be success', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, firstOrgId);
        const res = await OrganizationsHelper.validateOneDiscussion(userVlad, firstOrgId, postId);

        expect(res.status).toBe(200);
        expect(res.body.success).toBeTruthy();
      });

      it('should be ok if user is orgTeam member', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithTeam(userVlad, [userJane]);
        await UsersHelper.directlySetUserConfirmsInvitation(firstOrgId, userJane);

        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, firstOrgId);
        const res = await OrganizationsHelper.validateOneDiscussion(userJane, firstOrgId, postId);

        expect(res.status).toBe(200);
        expect(res.body.success).toBeTruthy();
      });
    });

    describe('Negative', () => {
      it('Error if post is not a post of organization', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithTeam(userVlad, [userJane]);
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const res = await OrganizationsHelper.validateOneDiscussion(userVlad, firstOrgId, postId);

        ResponseHelper.expectErrorMatchMessage(res, 'Post should be made by organization member');
      });

      it('Error if post is a post of different organization', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithTeam(userVlad, [userJane]);
        const secondOrgId = await OrganizationsGenerator.createOrgWithTeam(userVlad, [userJane]);

        const secondOrgPostId = await PostsGenerator.createMediaPostOfOrganization(userVlad, secondOrgId);
        const res = await OrganizationsHelper.validateOneDiscussion(userVlad, firstOrgId, secondOrgPostId);

        ResponseHelper.expectErrorMatchMessage(res, 'Post should be made by organization member');
      });

      it('organization id does not exist', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithTeam(userVlad, [userJane]);
        const postId = await PostsGenerator.createDirectPostForOrganizationV2AndGetId(userVlad, firstOrgId);
        const res = await OrganizationsHelper.validateOneDiscussion(userVlad, 100500, postId);

        expect(res.status).toBe(404);
      });

      it('post type is not a media post (publication)', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithTeam(userVlad, [userJane]);
        const postId = await PostsGenerator.createDirectPostForOrganizationV2AndGetId(userVlad, firstOrgId);
        const res = await OrganizationsHelper.validateOneDiscussion(userVlad, firstOrgId, postId);

        ResponseHelper.expectErrorMatchMessage(res, 'Post type ID is not allowed');
      });

      it('Discussions amount is no more than 10', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postsIds = await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, firstOrgId, 10);

        await OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, postsIds);

        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, firstOrgId);

        const res = await OrganizationsHelper.validateOneDiscussion(userVlad, firstOrgId, postId);

        ResponseHelper.expectErrorMatchMessage(res, 'already has maximum allowed amount of discussions');
      });

      it('Post ID does not exist', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithTeam(userVlad, [userJane]);
        await PostsGenerator.createDirectPostForOrganizationV2AndGetId(userVlad, firstOrgId);
        const res = await OrganizationsHelper.validateOneDiscussion(userVlad, firstOrgId, 100500);

        ResponseHelper.expectErrorMatchMessage(res, 'There is no post with ID');
      });

      it('check validation - should be error if user is not a team member', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithTeam(userVlad, [userJane]);
        // Jane does not confirm invitation
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const res = await OrganizationsHelper.validateOneDiscussion(userJane, firstOrgId, postId);

        expect(res.status).toBe(403);
      });
    });
  });

  describe('Create discussions. #posts', () => {
    describe('Positive', () => {
      it('Should add discussions to existing organizations', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, firstOrgId, 3);
        const postsIds = [1, 3, 2];

        await OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, postsIds);

        const secondOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const secondOrgPostIds: number[] = await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, secondOrgId, 5);
        await OrganizationsGenerator.changeDiscussionsState(userVlad, secondOrgId, secondOrgPostIds);

        const orgModel: OrgModelResponse =
          await OrganizationsHelper.requestToGetOneOrganizationAsGuest(firstOrgId);

        const options = {
          mustHaveValue: {
            discussions: true,
          },
          postProcessing: EntityResponseState.card(),
        };

        CommonHelper.checkOneOrganizationFully(orgModel, options);
        CommonHelper.expectModelsExistence(orgModel.discussions, postsIds, true);

        const secondOrgModel: OrgModelResponse =
          await OrganizationsHelper.requestToGetOneOrganizationAsGuest(secondOrgId);

        CommonHelper.expectModelsExistence(secondOrgModel.discussions, secondOrgPostIds, true);
      }, JEST_TIMEOUT);
    });
  });
});

export {};
