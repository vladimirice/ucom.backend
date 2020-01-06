import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { PostModelResponse } from '../../../../lib/posts/interfaces/model-interfaces';
import { GraphqlHelper } from '../../helpers/graphql-helper';

import SeedsHelper = require('../../helpers/seeds-helper');
import CommonHelper = require('../../helpers/common-helper');

import CommentsGenerator = require('../../../generators/comments-generator');
import UsersActivityRequestHelper = require('../../../helpers/users/activity/users-activity-request-helper');
import PostsChecker = require('../../../helpers/posts/posts-checker');

let userVlad: UserModel;

let userJane: UserModel;

const JEST_TIMEOUT = 10000;

beforeAll(async () => { await SeedsHelper.withGraphQlMockAllWorkers(); });
beforeEach(async () => { [userVlad, userJane] = await SeedsHelper.beforeAllRoutineMockAccountsProperties(); });
afterAll(async () => { await SeedsHelper.afterAllWithGraphQl(); });

it('Get auto-update WITHOUT comments as myself. #smoke #myself #media-post', async () => {
  const postId = await UsersActivityRequestHelper.trustOneUserWithFakeAutoUpdateAndGetId(userVlad, userJane.id);

  const post: PostModelResponse = await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

  CommonHelper.checkOnePostV2WithoutOrg(post, true, true, true);
}, JEST_TIMEOUT);

it('Get one media post WITH comments as myself. #smoke #myself #media-post #comments', async () => {
  const postId = await UsersActivityRequestHelper.trustOneUserWithFakeAutoUpdateAndGetId(userVlad, userJane.id);

  const [commentOne, commentTwo] =
        await CommentsGenerator.createManyCommentsForPost(postId, userJane, 2);

  const post: PostModelResponse = await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

  PostsChecker.checkOnePostWithTwoComments(post, commentOne, commentTwo, true);
}, JEST_TIMEOUT);

export {};
