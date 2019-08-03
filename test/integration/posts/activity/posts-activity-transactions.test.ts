import { PostModel } from '../../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsHelper = require('../../helpers/posts-helper');
import UsersActivityCommonHelper = require('../../../helpers/users/activity/users-activity-common-helper');
import NotificationsEventIdDictionary = require('../../../../lib/entities/dictionary/notifications-event-id-dictionary');

let userVlad;
let userJane;

const { ContentInteractionsApi } = require('ucom-libs-wallet').Content;

const JEST_TIMEOUT = 20000;

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
    it('Vlad upvotes post of Jane', async () => {
      const post: PostModel = await PostsGenerator.createMediaPostByUserHimselfAndGetModel(userJane);

      const signedTransactionObject = await ContentInteractionsApi.getUpvoteContentSignedTransaction(
        userVlad.account_name,
        userVlad.private_key,
        post.blockchain_id,
      );

      await PostsHelper.requestToUpvotePost(userVlad, post.id, true, signedTransactionObject);

      const eventId = NotificationsEventIdDictionary.getUserUpvotesPostOfOtherUser();

      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT);
  });

  describe('Downvote-related tests', () => {
    it('Vlad downvotes post', async () => {
      const post: PostModel = await PostsGenerator.createMediaPostByUserHimselfAndGetModel(userJane);

      const signedTransactionObject = await ContentInteractionsApi.getDownvoteContentSignedTransaction(
        userVlad.account_name,
        userVlad.private_key,
        post.blockchain_id,
      );

      await PostsHelper.requestToDownvotePost(userVlad, post.id, signedTransactionObject);

      const eventId = NotificationsEventIdDictionary.getUserDownvotesPostOfOtherUser();

      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT);
  });
});

export {};
