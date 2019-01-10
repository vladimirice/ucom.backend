export {};

const helpers = require('../helpers');
const delay   = require('delay');
const gen     = require('../../generators');

const rabbitMqService         = require('../../../lib/jobs/rabbitmq-service');
const usersActivityRepository = require('../../../lib/users/repository').Activity;

const commentsRepository = require('../../../lib/comments/repository').Main;

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

let userVlad;
let userJane;

describe('Comment related blockchain transactions.', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
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

      await helpers.Comments.requestToCreateComment(postId, user);

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

      await helpers.Seeds.bulkCreateComments();

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

      await helpers.Comments.requestToCreateCommentOnComment(postId, parentCommentId, user);

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

      const post = await helpers.Seeds.createMediaPostWithoutOrg(user);

      await helpers.Comments.requestToCreateComment(post.id, user);

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

      const post = await helpers.Seeds.createMediaPostWithoutOrg(user);
      const comment = await helpers.Seeds.createCommentOnPostWithoutOrg(user, post.id);

      await helpers.Comments.requestToCreateCommentOnComment(post.id, comment.id, user);

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
        const postId  = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await helpers.Comments.requestToUpvoteComment(postId, comment.id, userJane);
        const blockchainId = await commentsRepository.findBlockchainIdById(comment.id);

        let activity;
        while (!activity) {
          activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(userJane.id);
          await delay(100);
        }

        const expectedPushResult =
          helpers.EosTransaction.getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(
            userJane.account_name,
            blockchainId,
            InteractionTypeDictionary.getUpvoteId(),
          );

        expect(JSON.parse(activity.signed_transaction))
          .toMatchObject(helpers.EosTransaction.getPartOfSignedUserVotesPostOfOtherUser());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedPushResult);
      }, 20000);

      it('Jane DOWNVOTES Vlad posts', async () => {
        const postId  = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await helpers.Comments.requestToDownvoteComment(postId, comment.id, userJane);
        const blockchainId = await commentsRepository.findBlockchainIdById(comment.id);

        let activity;
        while (!activity) {
          activity = await usersActivityRepository.findLastWithBlockchainIsSentStatus(userJane.id);
          await delay(100);
        }

        const expectedPushResult =
          helpers.EosTransaction.getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(
            userJane.account_name,
            blockchainId,
            InteractionTypeDictionary.getDownvoteId(),
          );

        expect(JSON.parse(activity.signed_transaction))
          .toMatchObject(helpers.EosTransaction.getPartOfSignedUserVotesPostOfOtherUser());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedPushResult);
      }, 20000);
    });
  });
});
