import SeedsHelper = require('../helpers/seeds-helper');
import CommentsHelper = require('../helpers/comments-helper');
import CommentsGenerator = require('../../generators/comments-generator');
import PostsGenerator = require('../../generators/posts-generator');
import EosTransactionHelper = require('../helpers/eos-transaction-helpers');

export {};

const delay   = require('delay');

const rabbitMqService         = require('../../../lib/jobs/rabbitmq-service');
const usersActivityRepository = require('../../../lib/users/repository').Activity;

const commentsRepository = require('../../../lib/comments/repository').Main;


let userVlad;
let userJane;

describe('Comment related blockchain transactions.', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organization comments.', () => {
    it('Org. Should create and process valid direct comment creation transaction', async () => {
      await rabbitMqService.purgeBlockchainQueue();
      const user = userVlad;
      const postId = 1; // post_id = 1 is belong to organization of author vlad

      const expectedBlockchainResponse = {
        processed: {
          action_traces: [
            {
              act: {
                account: 'tst.activity',
                name: 'makecontorg',
                authorization: [
                  {
                    actor: user.account_name,
                    permission: 'active',
                  },
                ],
                data: {
                  acc: user.account_name,
                  organization_id: 'sample_blockchain_id_1',
                  content_type_id: 3,
                  parent_content_id: 'pstms1-yed143ojlcdq0dl',
                },
              },
            },
          ],
        },
      };

      await CommentsGenerator.createCommentForPost(postId, user);

      let activity: any = null;
      while (!activity) {
        activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.signed_transaction.length).toBeGreaterThan(0);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 20000);

    it('Org. should create and process valid comment on comment creation transaction', async () => {
      await rabbitMqService.purgeBlockchainQueue();
      const user = userVlad;
      const postId = 1; // post_id = 1 is belong to organization of author vlad
      const parentCommentId = 1;

      await SeedsHelper.bulkCreateComments();

      const expectedBlockchainResponse = {
        processed: {
          action_traces: [
            {
              act: {
                account: 'tst.activity',
                name: 'makecontorg',
                authorization: [
                  {
                    actor: user.account_name,
                    permission: 'active',
                  },
                ],
                data: {
                  acc: user.account_name,
                  organization_id: 'sample_blockchain_id_1',
                  content_type_id: 3,
                  parent_content_id: 'sample_comment_blockchain_id1',
                },
              },
            },
          ],
        },
      };

      await CommentsGenerator.createCommentOnComment(postId, parentCommentId, user);

      let activity: any = null;
      while (!activity) {
        activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.signed_transaction.length).toBeGreaterThan(0);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 20000);
  });

  describe('User himself. Comment creation related transaction', () => {
    it('Comment on post without org ID. Should create and process valid transaction.', async () => {
      await rabbitMqService.purgeBlockchainQueue();
      const user = userVlad;

      const post = await SeedsHelper.createMediaPostWithoutOrg(user);

      await CommentsGenerator.createCommentForPost(post.id, user);

      const expectedBlockchainResponse = {
        processed: {
          action_traces: [
            {
              act: {
                account: 'tst.activity',
                name: 'makecontent',
                authorization: [
                  {
                    actor: user.account_name,
                    permission: 'active',
                  },
                ],
                data: {
                  acc: user.account_name,
                  content_type_id: 3,
                  parent_content_id: 'sample_post_blockchain_id',
                },
              },
            },
          ],
        },
      };

      let activity: any = null;
      while (!activity) {
        activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.signed_transaction.length).toBeGreaterThan(0);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 20000);

    // tslint:disable-next-line:max-line-length
    it('Comment on comment without org ID. Should create and process valid transaction.', async () => {
      await rabbitMqService.purgeBlockchainQueue();
      const user = userVlad;

      const expectedBlockchainResponse = {
        processed: {
          action_traces: [
            {
              act: {
                account: 'tst.activity',
                name: 'makecontent',
                authorization: [
                  {
                    actor: user.account_name,
                    permission: 'active',
                  },
                ],
                data: {
                  acc: user.account_name,
                  content_type_id: 3,
                  parent_content_id: 'sample_comment_on_post_blockchain_id',
                },
              },
            },
          ],
        },
      };

      const post = await SeedsHelper.createMediaPostWithoutOrg(user);
      const comment = await SeedsHelper.createCommentOnPostWithoutOrg(user, post.id);

      await CommentsGenerator.createCommentOnComment(post.id, comment.id, user);

      let activity: any = null;
      while (!activity) {
        activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.signed_transaction.length).toBeGreaterThan(0);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 10000);
  });

  describe('Comments activity transactions', () => {
    describe('Votes related transactions', () => {
      it('Jane upvotes Vlad posts', async () => {
        const postId  = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        await CommentsHelper.requestToUpvoteComment(postId, comment.id, userJane);
        const blockchainId = await commentsRepository.findBlockchainIdById(comment.id);

        let activity;
        while (!activity) {
          activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(userJane.id);
          await delay(100);
        }

        const expectedPushResult =
          EosTransactionHelper.getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(
            userJane.account_name,
            blockchainId,
          );

        expect(JSON.parse(activity.signed_transaction))
          .toMatchObject(EosTransactionHelper.getPartOfSignedUserVotesPostOfOtherUser());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedPushResult);
      }, 20000);

      it('Jane DOWNVOTES Vlad posts', async () => {
        const postId  = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const comment = await CommentsGenerator.createCommentForPost(postId, userVlad);

        await CommentsHelper.requestToDownvoteComment(postId, comment.id, userJane);
        const blockchainId = await commentsRepository.findBlockchainIdById(comment.id);

        let activity;
        while (!activity) {
          activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(userJane.id);
          await delay(100);
        }

        const expectedPushResult =
          EosTransactionHelper.getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(
            userJane.account_name,
            blockchainId,
          );

        expect(JSON.parse(activity.signed_transaction))
          .toMatchObject(EosTransactionHelper.getPartOfSignedUserVotesPostOfOtherUser());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedPushResult);
      }, 20000);
    });
  });
});
