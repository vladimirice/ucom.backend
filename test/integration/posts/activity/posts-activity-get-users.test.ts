import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsHelper = require('../../helpers/posts-helper');
import OneEntityRequestHelper = require('../../../helpers/common/one-entity-request-helper');
import CommonChecker = require('../../../helpers/common/common-checker');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');


const JEST_TIMEOUT = 10000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

beforeAll(async () => {
  await SeedsHelper.withGraphQlMockAllWorkers();
});
afterAll(async () => {
  await SeedsHelper.doAfterAll();
});
beforeEach(async () => {
  [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutineMockAccountsProperties();
});

it('Users who upvote a post', async () => {
  const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

  await Promise.all([
    PostsHelper.requestToUpvotePost(userJane, postId),
    PostsHelper.requestToUpvotePost(userPetr, postId),
    PostsHelper.requestToDownvotePost(userRokky, postId), // disturbance
  ]);

  const response =
    await OneEntityRequestHelper.getOneEntityUsersWhoVote(
      postId,
      EntityNames.POSTS,
      InteractionTypeDictionary.getUpvoteId(),
    );

  CommonChecker.expectModelIdsExistenceInResponseList(response, [userJane.id, userPetr.id], 2);
}, JEST_TIMEOUT_DEBUG);

it('Users who downvote a post', async () => {
  const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

  await Promise.all([
    PostsHelper.requestToDownvotePost(userJane, postId),
    PostsHelper.requestToDownvotePost(userPetr, postId),
    PostsHelper.requestToUpvotePost(userRokky, postId), // disturbance
  ]);

  const response =
    await OneEntityRequestHelper.getOneEntityUsersWhoVote(
      postId,
      EntityNames.POSTS,
      InteractionTypeDictionary.getDownvoteId(),
    );

  CommonChecker.expectModelIdsExistenceInResponseList(response, [userJane.id, userPetr.id], 2);
}, JEST_TIMEOUT_DEBUG);

it('Users who vote a post', async () => {
  const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

  const promises = [
    PostsHelper.requestToDownvotePost(userJane, postId),
    PostsHelper.requestToDownvotePost(userPetr, postId),
    PostsHelper.requestToUpvotePost(userRokky, postId),
  ];

  await Promise.all(promises);

  const response = await OneEntityRequestHelper.getOneEntityUsersWhoVote(postId, EntityNames.POSTS);

  CommonChecker.expectModelIdsExistenceInResponseList(response, [userJane.id, userPetr.id, userRokky.id], promises.length);

  // TODO - fetch a metadata value - upvote or downvote
}, JEST_TIMEOUT_DEBUG);
