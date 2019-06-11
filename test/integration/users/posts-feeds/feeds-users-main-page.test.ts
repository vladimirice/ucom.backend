import ResponseHelper = require('../../helpers/response-helper');

const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

import SeedsHelper = require('../../helpers/seeds-helper');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsGraphqlRequest = require('../../../helpers/posts/posts-graphql-request');
import CommonChecker = require('../../../helpers/common/common-checker');

let userVlad;
let userJane;
let userPetr;
let userRokky;

const JEST_TIMEOUT = 10000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('Users feeds - main page', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });

  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });

  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    let orgPostIds: number[] = [];
    let userToOrgDirectPostsIds: number[] = [];

    let userHimselfMediaPostsIds: number[] = [];
    let userHimselfDirectPosts: number[] = [];
    let repostIds: number[] = [];

    beforeEach(async () => {
      userHimselfMediaPostsIds = await Promise.all([
        PostsGenerator.createMediaPostByUserHimself(userVlad),
        PostsGenerator.createMediaPostByUserHimself(userJane),
        PostsGenerator.createMediaPostByUserHimself(userPetr),
      ]);

      userHimselfDirectPosts = await Promise.all([
        PostsGenerator.createDirectPostForUserAndGetId(userVlad, userJane),
        PostsGenerator.createDirectPostForUserAndGetId(userJane, userVlad),
      ]);

      const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      orgPostIds = await PostsGenerator.createManyMediaPostsOfOrganization(userVlad, orgId, 2);

      userToOrgDirectPostsIds = await Promise.all([
        PostsGenerator.createDirectPostForOrganizationV2AndGetId(userJane, orgId),
        PostsGenerator.createDirectPostForOrganizationV2AndGetId(userPetr, orgId),
      ]);

      repostIds = await Promise.all([
        PostsGenerator.createRepostOfUserPost(userPetr, userHimselfDirectPosts[0]),
        PostsGenerator.createRepostOfUserPost(userRokky, userHimselfMediaPostsIds[0]),
        PostsGenerator.createRepostOfUserPost(userPetr, orgPostIds[0]),
      ]);
    });

    it('top publications of users', async () => {
      const response = await PostsGraphqlRequest.getUsersMainPageTopPublications();

      CommonChecker.expectModelIdsExistenceInResponseList(response, userHimselfMediaPostsIds);

      CommonChecker.expectModelIdsDoNotExistInResponseList(
        response,
        userHimselfDirectPosts.concat(orgPostIds, userToOrgDirectPostsIds, repostIds),
      );

      for (const post of response.data) {
        expect(post.entity_name_for).toBe(EntityNames.USERS);
        expect(post.organization_id).toBeNull();
      }
    }, JEST_TIMEOUT);

    it('feed of users posts', async () => {
      const response = await PostsGraphqlRequest.getUsersMainPageFeed();
      CommonChecker.expectModelIdsExistenceInResponseList(
        response,
        userHimselfMediaPostsIds.concat(userHimselfDirectPosts),
      );

      CommonChecker.expectModelIdsDoNotExistInResponseList(
        response,
        orgPostIds.concat(userToOrgDirectPostsIds, repostIds),
      );

      for (const post of response.data) {
        expect(post.entity_name_for).toBe(EntityNames.USERS);
        expect(post.organization_id).toBeNull();
        ResponseHelper.checkListResponseStructure(post.comments);
      }
    }, JEST_TIMEOUT);
  });
});

export {};
