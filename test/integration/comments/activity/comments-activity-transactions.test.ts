import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import UsersActivityCommonHelper = require('../../../helpers/users/activity/users-activity-common-helper');
import NotificationsEventIdDictionary = require('../../../../lib/entities/dictionary/notifications-event-id-dictionary');
import CommentsGenerator = require('../../../generators/comments-generator');
import CommentsHelper = require('../../helpers/comments-helper');

let userVlad;
let userJane;

const { ContentInteractionsApi } = require('ucom-libs-wallet').Content;

const JEST_TIMEOUT = 10000;

describe('User to post activity', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlNoMocking();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithoutGraphQlNoConnectionsKill();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Upvote-related tests', () => {
    it('Vlad upvotes comment of Jane', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

      const signedTransactionObject = await ContentInteractionsApi.getUpvoteContentSignedTransaction(
        userVlad.account_name,
        userVlad.private_key,
        comment.blockchain_id,
      );

      await CommentsHelper.requestToUpvoteComment(postId, comment.id, userVlad, signedTransactionObject);

      const eventId = NotificationsEventIdDictionary.getUserUpvotesCommentOfOtherUser();
      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT);
  });

  describe('Downvote-related tests', () => {
    it('Vlad downvotes comment of Jane', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const comment = await CommentsGenerator.createCommentForPost(postId, userJane);

      const signedTransactionObject = await ContentInteractionsApi.getDownvoteContentSignedTransaction(
        userVlad.account_name,
        userVlad.private_key,
        comment.blockchain_id,
      );

      await CommentsHelper.requestToDownvoteComment(postId, comment.id, userVlad, signedTransactionObject);

      const eventId = NotificationsEventIdDictionary.getUserDownvotesCommentOfOtherUser();
      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT);
  });
});

export {};
