import { GraphqlHelper } from '../helpers/graphql-helper';

import { PostModelResponse } from '../../../lib/posts/interfaces/model-interfaces';
import { CommentModelResponse, CommentsListResponse } from '../../../lib/comments/interfaces/model-interfaces';

import CommonGenerator = require('../../generators/common-generator');
import OrganizationsHelper = require('../helpers/organizations-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import ActivityHelper = require('../helpers/activity-helper');

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

  it('#smoke - comment should contain organization data', async () => {
    const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
    const postId: number = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);
    await CommentsGenerator.createCommentForPost(postId, userVlad);

    await ActivityHelper.requestToFollowOrganization(orgId, userJane);

    const response = await GraphqlHelper.getUserNewsFeed(userJane);
    const post: PostModelResponse = response.data.find(item => item.id === postId)!;
    expect(post).toBeDefined();

    const commentsList: CommentsListResponse = post.comments;
    expect(commentsList.data.length).toBe(1);
    const comment: CommentModelResponse = commentsList.data[0];
    expect(comment.organization_id).toBe(orgId);

    OrganizationsHelper.checkOneOrganizationPreviewFields(comment.organization);
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
        const model: PostModelResponse = posts.find(orgPost => orgPost.id === orgPosts[orgId])!;
        expect(model).toBeDefined();

        expect(model.organization_id).toBe(+orgId);
        OrganizationsHelper.checkOneOrganizationPreviewFields(model.organization);
      }
    }, JEST_TIMEOUT);
  });
});

export {};
