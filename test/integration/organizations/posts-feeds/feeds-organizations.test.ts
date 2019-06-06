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

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });

  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Main page organizations posts feed', () => {
    it('should receive only posts without comments via GraphQL', async () => {
      const [firstOrgId, secondOrgId] = await Promise.all([
        OrganizationsGenerator.createOrgWithoutTeam(userVlad),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
      ]);

      const [firstOrgPostsIds, secondOrgPostsIds] = await Promise.all([
        PostsGenerator.createManyMediaPostsOfOrganization(userVlad, firstOrgId, 4),
        PostsGenerator.createManyMediaPostsOfOrganization(userJane, secondOrgId, 3),
      ]);

      // disturbance
      const userPostsIds: number[] = await Promise.all([
        PostsGenerator.createMediaPostByUserHimself(userVlad),
        PostsGenerator.createMediaPostByUserHimself(userJane),
      ]);

      const response = await PostsGraphqlRequest.getPostsFeed();

      CommonChecker.expectModelIdsDoNotExistInResponseList(response, userPostsIds);
      for (const post of response.data) {
        expect(post.entity_name_for).toBe(EntityNames.ORGANIZATIONS);
        CommonChecker.expectPositiveNonZeroInteger(post.organization_id);
        expect(post.comments).toBeNull();
      }
      CommonChecker.expectModelIdsExistenceInResponseList(response, firstOrgPostsIds.concat(secondOrgPostsIds));
    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
