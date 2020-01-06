import { InteractionTypesDictionary } from 'ucom.libs.common';
import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsHelper = require('../../helpers/posts-helper');
import OneEntityRequestHelper = require('../../../helpers/common/one-entity-request-helper');
import CommonChecker = require('../../../helpers/common/common-checker');
import CommentsGenerator = require('../../../generators/comments-generator');
import CommentsHelper = require('../../helpers/comments-helper');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

const JEST_TIMEOUT = 10000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

let postId: number;
let commentId: number;

const entityName = EntityNames.COMMENTS;

beforeAll(async () => {
  await SeedsHelper.withGraphQlMockAllWorkers();
});
afterAll(async () => {
  await SeedsHelper.doAfterAll();
});
beforeEach(async () => {
  [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutineMockAccountsProperties();

  postId = await PostsGenerator.createMediaPostByUserHimself(userJane);
  commentId = await CommentsGenerator.createCommentForPostAndGetId(postId, userVlad);
});

function expectContentVote(user: UserModel, expectedValue: number): void {
  expect(user.relatedMetadata.contentVote).toBe(expectedValue);
}

it('Users who upvote a comment', async () => {
  await Promise.all([
    CommentsHelper.requestToUpvoteComment(postId, commentId, userJane),
    CommentsHelper.requestToUpvoteComment(postId, commentId, userPetr),

    // disturbance
    CommentsHelper.requestToDownvoteComment(postId, commentId, userRokky),
    PostsHelper.requestToUpvotePost(userPetr, postId),
  ]);

  const response =
    await OneEntityRequestHelper.getOneEntityUsersWhoVote(
      postId,
      entityName,
      InteractionTypesDictionary.getUpvoteId(),
    );

  CommonChecker.expectModelIdsExistenceInResponseList(response, [userJane.id, userPetr.id], 2);

  for (const user of response.data) {
    expectContentVote(user, InteractionTypesDictionary.getUpvoteId());
  }
}, JEST_TIMEOUT);

it('Users who downvote a comment', async () => {
  await Promise.all([
    CommentsHelper.requestToDownvoteComment(postId, commentId, userJane),
    CommentsHelper.requestToDownvoteComment(postId, commentId, userPetr),

    // disturbance
    CommentsHelper.requestToUpvoteComment(postId, commentId, userRokky),
    PostsHelper.requestToDownvotePost(userPetr, postId),
  ]);

  const response =
    await OneEntityRequestHelper.getOneEntityUsersWhoVote(
      postId,
      entityName,
      InteractionTypesDictionary.getDownvoteId(),
    );

  CommonChecker.expectModelIdsExistenceInResponseList(response, [userJane.id, userPetr.id], 2);

  for (const user of response.data) {
    expectContentVote(user, InteractionTypesDictionary.getDownvoteId());
  }
}, JEST_TIMEOUT);

it('Users who vote a comment', async () => {
  const promises = [
    CommentsHelper.requestToDownvoteComment(postId, commentId, userJane),
    CommentsHelper.requestToDownvoteComment(postId, commentId, userPetr),

    CommentsHelper.requestToUpvoteComment(postId, commentId, userRokky),

    // disturbance
    PostsHelper.requestToDownvotePost(userRokky, postId),
    PostsHelper.requestToUpvotePost(userPetr, postId),
  ];

  await Promise.all(promises);

  const response = await OneEntityRequestHelper.getOneEntityUsersWhoVote(postId, entityName);
  CommonChecker.expectModelIdsExistenceInResponseList(response, [userJane.id, userPetr.id, userRokky.id], 3);

  for (const user of response.data) {
    CommonChecker.expectNotEmpty(user.relatedMetadata);

    const contentVote = [userJane.id, userPetr.id].includes(user.id) ?
      InteractionTypesDictionary.getDownvoteId() : InteractionTypesDictionary.getUpvoteId();

    expectContentVote(user, contentVote);
  }
}, JEST_TIMEOUT);
