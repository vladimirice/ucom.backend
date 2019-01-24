import { GraphqlHelper } from '../helpers/graphql-helper';

import { PostModelResponse } from '../../../lib/posts/interfaces/model-interfaces';

import CommonGenerator = require('../../generators/common-generator');
import OrganizationsHelper = require('../helpers/organizations-helper');

const mockHelper = require('../helpers/mock-helper.ts');
const seedsHelper = require('../helpers/seeds-helper.ts');

require('cross-fetch/polyfill');

mockHelper.mockAllBlockchainPart();

let userVlad;
let userJane;
let userPetr;
let userRokky;

const JEST_TIMEOUT = 20000;

describe('#feeds myself news feed. #graphql', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await seedsHelper.beforeAllRoutine();
    await GraphqlHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      seedsHelper.doAfterAll(),
      GraphqlHelper.afterAll(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('#smoke - myself news feed', async () => {
      const seeds = await CommonGenerator.createFeedsForAllUsers(
        userVlad,
        userJane,
        userPetr,
        userRokky,
      );

      const [
        vladMediaPost, vladDirectPost,
        janeMediaPost, janeDirectPost,
        petrMediaPost, petrDirectPost,
      ] = seeds.posts.raw;

      const response = await GraphqlHelper.getUserNewsFeed(userVlad);

      const posts = response.data;

      expect(posts.some(post => post.id === vladMediaPost)).toBeTruthy();
      expect(posts.some(post => post.id === vladDirectPost.id)).toBeTruthy();

      expect(posts.some(post => post.id === janeMediaPost)).toBeTruthy();
      expect(posts.some(post => post.id === janeDirectPost.id)).toBeTruthy();

      expect(posts.some(post => post.id === petrMediaPost)).toBeTruthy();
      expect(posts.some(post => post.id === petrDirectPost.id)).toBeTruthy();

      // Check organization post


      const orgPosts = seeds.posts.org;
      // eslint-disable-next-line guard-for-in
      for (const orgId in orgPosts) {
        const model: PostModelResponse = posts.find(orgPost => orgPost.id === orgPosts[orgId]);
        expect(model).toBeDefined();

        expect(model.organization_id).toBe(+orgId);
        OrganizationsHelper.checkOneOrganizationPreviewFields(model.organization);
      }
    }, JEST_TIMEOUT);
  });
});

export {};
