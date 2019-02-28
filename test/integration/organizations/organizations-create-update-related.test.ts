import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { OrgModelResponse } from '../../../lib/organizations/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');

import OrganizationsHelper = require('../helpers/organizations-helper');
import CommonHelper = require('../helpers/common-helper');
import ResponseHelper = require('../helpers/response-helper');
import EntityResponseState = require('../../../lib/common/dictionary/EntityResponseState');

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
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const res = await OrganizationsHelper.validateOneDiscussion(userVlad, firstOrgId, postId);

        expect(res.status).toBe(200);
        expect(res.body.success).toBeTruthy();
      });
    });

    describe('Negative', () => {
      it('check validation - should be error if wrong user', async () => {
        const firstOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
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

        CommonHelper.expectModelsExistence(orgModel.discussions, postsIds);

        ResponseHelper.checkOrderingById(orgModel.discussions, postsIds);

        const secondOrgModel: OrgModelResponse =
          await OrganizationsHelper.requestToGetOneOrganizationAsGuest(secondOrgId);

        CommonHelper.expectModelsExistence(secondOrgModel.discussions, secondOrgPostIds);
      }, JEST_TIMEOUT);
    });
  });
});

export {};
