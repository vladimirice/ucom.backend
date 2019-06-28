import ResponseHelper = require('../../helpers/response-helper');

const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

import SeedsHelper = require('../../helpers/seeds-helper');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsGraphqlRequest = require('../../../helpers/posts/posts-graphql-request');
import CommonChecker = require('../../../helpers/common/common-checker');

let userVlad;
let userJane;

const JEST_TIMEOUT = 10000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('Organizations feeds - main page', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });

  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Main page organizations feed', () => {
    let firstOrgPostsIds: number[] = [];
    let secondOrgPostsIds: number[] = [];
    let userToOrgDirectPostsIds: number[] = [];

    let userHimselfMediaPostsIds: number[] = [];
    let userHimselfDirectPosts: number[] = [];

    beforeEach(async () => {
      const [firstOrgId, secondOrgId] = await Promise.all([
        OrganizationsGenerator.createOrgWithoutTeam(userVlad),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
      ]);

      [firstOrgPostsIds, secondOrgPostsIds] = await Promise.all([
        PostsGenerator.createManyMediaPostsOfOrganization(userVlad, firstOrgId, 4),
        PostsGenerator.createManyMediaPostsOfOrganization(userJane, secondOrgId, 3),
      ]);

      userToOrgDirectPostsIds = await Promise.all([
        PostsGenerator.createDirectPostForOrganizationV2AndGetId(userJane, firstOrgId),
        PostsGenerator.createDirectPostForOrganizationV2AndGetId(userVlad, secondOrgId),
      ]);

      userHimselfMediaPostsIds = await Promise.all([
        PostsGenerator.createMediaPostByUserHimself(userVlad),
        PostsGenerator.createMediaPostByUserHimself(userJane),
      ]);

      userHimselfDirectPosts = await Promise.all([
        PostsGenerator.createDirectPostForUserAndGetId(userVlad, userJane),
        PostsGenerator.createDirectPostForUserAndGetId(userJane, userVlad),
      ]);
    });

    it('top organization publications', async () => {
      const response = await PostsGraphqlRequest.getOrgMainPageTopPublications();

      CommonChecker.expectModelIdsExistenceInResponseList(response, firstOrgPostsIds.concat(secondOrgPostsIds));
      CommonChecker.expectModelIdsDoNotExistInResponseList(
        response,
        userHimselfMediaPostsIds.concat(userHimselfDirectPosts, userToOrgDirectPostsIds),
      );

      for (const post of response.data) {
        expect(post.entity_name_for).toBe(EntityNames.ORGANIZATIONS);
        CommonChecker.expectPositiveNonZeroInteger(post.organization_id);
        expect(post.comments).toBeNull();
      }
    }, JEST_TIMEOUT);

    it('organizations feed', async () => {
      const response = await PostsGraphqlRequest.getOrgMainPageFeed();
      CommonChecker.expectModelIdsExistenceInResponseList(
        response,
        firstOrgPostsIds.concat(secondOrgPostsIds, userToOrgDirectPostsIds),
      );

      CommonChecker.expectModelIdsDoNotExistInResponseList(
        response,
        userHimselfMediaPostsIds.concat(userHimselfDirectPosts),
      );

      for (const post of response.data) {
        expect(post.entity_name_for).toBe(EntityNames.ORGANIZATIONS);
        ResponseHelper.checkListResponseStructure(post.comments);
      }
    }, JEST_TIMEOUT);
  });
});

export {};
