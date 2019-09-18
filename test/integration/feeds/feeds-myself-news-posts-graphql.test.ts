import { ContentTypesDictionary } from 'ucom.libs.common';
import { GraphqlHelper } from '../helpers/graphql-helper';

import { PostModelResponse } from '../../../lib/posts/interfaces/model-interfaces';
import { CommentModelResponse, CommentsListResponse } from '../../../lib/comments/interfaces/model-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import CommonGenerator = require('../../generators/common-generator');
import OrganizationsHelper = require('../helpers/organizations-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');
import ActivityHelper = require('../helpers/activity-helper');
import CommonHelper = require('../helpers/common-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import UsersActivityRequestHelper = require('../../helpers/users/activity/users-activity-request-helper');
import UsersHelper = require('../helpers/users-helper');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 20000;

beforeAll(async () => {
  await SeedsHelper.withGraphQlMockAllWorkers();
});

afterAll(async () => {
  await SeedsHelper.afterAllWithGraphQl();
});

beforeEach(async () => {
  [userVlad, userJane] = await SeedsHelper.beforeAllRoutineMockAccountsProperties();
});


describe('Auto-updates', () => {
  it('should contain Vlad auto update post inside Jane news feed', async () => {
    // TODO
  });

  it('should contain auto-update post', async () => {
    await Promise.all([
      UsersActivityRequestHelper.trustOneUserWithFakeAutoUpdate(userVlad, userJane.id),
      PostsGenerator.createMediaPostByUserHimself(userVlad),
    ]);

    const response = await GraphqlHelper.getUserNewsFeed(userVlad);

    const { data } = response;

    expect(
      data.some((item) => item.post_type_id === ContentTypesDictionary.getTypeMediaPost()),
    ).toBe(true);

    expect(
      data.some((item) => item.post_type_id === ContentTypesDictionary.getTypeAutoUpdate()),
    ).toBe(true);

    const options = {
      ...CommonHelper.getOptionsForListAndMyself(),
      ...UsersHelper.propsAndCurrentParamsOptions(true),
    };

    await CommonHelper.checkPotsListsFromResponse(response, 2, options);
  }, JEST_TIMEOUT);
});


it('#smoke - comment should contain organization data', async () => {
  const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
  const postId: number = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);
  await CommentsGenerator.createCommentForPost(postId, userVlad);

  await ActivityHelper.requestToFollowOrganization(orgId, userJane);

  const response = await GraphqlHelper.getUserNewsFeed(userJane);
  const post: PostModelResponse = response.data.find((item) => item.id === postId)!;
  expect(post).toBeDefined();

  const commentsList: CommentsListResponse = post.comments;
  expect(commentsList.data.length).toBe(1);
  const comment: CommentModelResponse = commentsList.data[0];
  expect(comment.organization_id).toBe(orgId);

  OrganizationsHelper.checkOneOrganizationPreviewFields(comment.organization);
});

it('#smoke - myself news feed', async () => {
  const seeds = await CommonGenerator.createFeedsForAllUsers();

  const [
    vladMediaPost, vladDirectPost,
    janeMediaPost, janeDirectPost,
    petrMediaPost, petrDirectPost,
  ] = seeds.posts.raw;

  const response = await GraphqlHelper.getUserNewsFeed(userVlad);

  const posts = response.data;

  expect(posts.some((post) => post.id === vladMediaPost)).toBeTruthy();
  expect(posts.some((post) => post.id === vladDirectPost.id)).toBeTruthy();

  expect(posts.some((post) => post.id === janeMediaPost)).toBeTruthy();
  expect(posts.some((post) => post.id === janeDirectPost.id)).toBeTruthy();

  expect(posts.some((post) => post.id === petrMediaPost)).toBeTruthy();
  expect(posts.some((post) => post.id === petrDirectPost.id)).toBeTruthy();

  // Check organization post


  const orgPosts = seeds.posts.org;
  // eslint-disable-next-line guard-for-in
  for (const orgId in orgPosts) {
    const model: PostModelResponse = posts.find((orgPost) => orgPost.id === orgPosts[orgId])!;
    expect(model).toBeDefined();

    expect(model.organization_id).toBe(+orgId);
    OrganizationsHelper.checkOneOrganizationPreviewFields(model.organization);
  }

  CommonHelper.checkPostListResponseWithoutOrg(response, true, false);
}, JEST_TIMEOUT);

export {};
