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
import _ = require('lodash');

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

        expect(res.status).toBe(401);
      });
    });
  });

  describe('Delete all discussions', () => {
    it('Create and then delete all discussions', async () => {
      const [vladOrgId, janeOrgId] = await Promise.all([
        OrganizationsGenerator.createOrgWithoutTeam(userVlad),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
      ]);

      const [vladPostsIds, janePostsIds]: [number[], number[]] = await Promise.all([
        PostsGenerator.createManyMediaPostsOfOrganization(userVlad, vladOrgId, 5),
        PostsGenerator.createManyMediaPostsOfOrganization(userJane, janeOrgId, 8),
      ]);

      await Promise.all([
        OrganizationsGenerator.changeDiscussionsState(userVlad, vladOrgId, vladPostsIds),
        OrganizationsGenerator.changeDiscussionsState(userJane, janeOrgId, janePostsIds),
      ]);

      const vladOrgModelBefore: OrgModelResponse =
        await OrganizationsHelper.requestToGetOneOrganizationAsGuest(vladOrgId);

      CommonHelper.expectModelsExistence(vladOrgModelBefore.discussions, vladPostsIds, true);


      await OrganizationsGenerator.deleteAllDiscussions(userVlad, vladOrgId);

      const vladOrgModelAfter: OrgModelResponse =
        await OrganizationsHelper.requestToGetOneOrganizationAsGuest(vladOrgId);

      const options = {
        mustHaveValue: {
          discussions: false,
          usersTeam: false,
        },
      };

      CommonHelper.checkOneOrganizationFully(vladOrgModelAfter, options);

      const janeOrgModelAfter: OrgModelResponse =
        await OrganizationsHelper.requestToGetOneOrganizationAsGuest(janeOrgId);

      CommonHelper.expectModelsExistence(janeOrgModelAfter.discussions, janePostsIds, true);
    });
  });

  describe('Change discussions state. #posts #discussions', () => {
    describe('Positive', () => {
      it('Check all create-modify discussions workflow', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postsIds: number[] = await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, firstOrgId, 5);

        await OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, postsIds);

        const secondOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const secondOrgPostIds: number[] = await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, secondOrgId, 8);
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

        // Change order of two elements for first organization and two for second

        const reorderedFirstPostsIds = _.shuffle(postsIds);
        const reorderedSecondPostsIds = _.shuffle(secondOrgPostIds);
        await Promise.all([
          OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, reorderedFirstPostsIds),
          OrganizationsGenerator.changeDiscussionsState(userVlad, secondOrgId, reorderedSecondPostsIds),
        ]);

        const [firstModelWithShuffled, secondModelWithShuffled]  = await Promise.all([
          OrganizationsHelper.requestToGetOneOrganizationAsGuest(firstOrgId),
          OrganizationsHelper.requestToGetOneOrganizationAsGuest(secondOrgId),
        ]);

        CommonHelper.expectModelsExistence(firstModelWithShuffled.discussions, reorderedFirstPostsIds, true);
        CommonHelper.expectModelsExistence(secondModelWithShuffled.discussions, reorderedSecondPostsIds, true);

        // Delete some of discussions
        reorderedFirstPostsIds.pop();
        reorderedFirstPostsIds.shift();

        reorderedSecondPostsIds.pop();
        reorderedSecondPostsIds.shift();

        await Promise.all([
          OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, reorderedFirstPostsIds),
          OrganizationsGenerator.changeDiscussionsState(userVlad, secondOrgId, reorderedSecondPostsIds),
        ]);

        const [firstModelWithDeleted, secondModelWithDeleted]  = await Promise.all([
          OrganizationsHelper.requestToGetOneOrganizationAsGuest(firstOrgId),
          OrganizationsHelper.requestToGetOneOrganizationAsGuest(secondOrgId),
        ]);

        CommonHelper.expectModelsExistence(firstModelWithDeleted.discussions, reorderedFirstPostsIds, true);
        CommonHelper.expectModelsExistence(secondModelWithDeleted.discussions, reorderedSecondPostsIds, true);
      }, JEST_TIMEOUT);

      it('Check all create-modify discussions workflow for the state from maximum to lower', async () => {
        // Let's create discussions
        const firstOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postsIds: number[] = await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, firstOrgId, 10);

        await OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, postsIds);

        const secondOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const secondOrgPostIds: number[] = await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, secondOrgId, 8);
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

        // Change order of two elements for first organization and two for second

        const reorderedFirstPostsIds = _.shuffle(postsIds);
        const reorderedSecondPostsIds = _.shuffle(secondOrgPostIds);
        await Promise.all([
          OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, reorderedFirstPostsIds),
          OrganizationsGenerator.changeDiscussionsState(userVlad, secondOrgId, reorderedSecondPostsIds),
        ]);

        const [firstModelWithShuffled, secondModelWithShuffled]  = await Promise.all([
          OrganizationsHelper.requestToGetOneOrganizationAsGuest(firstOrgId),
          OrganizationsHelper.requestToGetOneOrganizationAsGuest(secondOrgId),
        ]);

        CommonHelper.expectModelsExistence(firstModelWithShuffled.discussions, reorderedFirstPostsIds, true);
        CommonHelper.expectModelsExistence(secondModelWithShuffled.discussions, reorderedSecondPostsIds, true);

        // Delete some of discussions
        reorderedFirstPostsIds.pop();
        reorderedFirstPostsIds.shift();

        reorderedSecondPostsIds.pop();
        reorderedSecondPostsIds.shift();

        await Promise.all([
          OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, reorderedFirstPostsIds),
          OrganizationsGenerator.changeDiscussionsState(userVlad, secondOrgId, reorderedSecondPostsIds),
        ]);

        const [firstModelWithDeleted, secondModelWithDeleted]  = await Promise.all([
          OrganizationsHelper.requestToGetOneOrganizationAsGuest(firstOrgId),
          OrganizationsHelper.requestToGetOneOrganizationAsGuest(secondOrgId),
        ]);

        CommonHelper.expectModelsExistence(firstModelWithDeleted.discussions, reorderedFirstPostsIds, true);
        CommonHelper.expectModelsExistence(secondModelWithDeleted.discussions, reorderedSecondPostsIds, true);
      }, JEST_TIMEOUT);
    });

    describe('Negative', () => {
      it('It is not possible to send list with duplicates', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

        const postsIds: number[] = await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, firstOrgId, 5);

        const duplicatedSet = _.clone(postsIds);
        duplicatedSet.push(postsIds[0]);

        const res = await OrganizationsGenerator.changeDiscussionsState(userVlad, firstOrgId, duplicatedSet, 400);
        ResponseHelper.expectErrorMatchMessage(res, 'discussions must be unique');
      });
    });
  });
});

export {};
