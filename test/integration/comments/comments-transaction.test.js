const helpers = require('../helpers');
const delay   = require('delay');
const gen     = require('../../generators');

const RabbitMqService         = require('../../../lib/jobs/rabbitmq-service');
const UsersActivityRepository = require('../../../lib/users/repository').Activity;

const CommentsRepository = require('../../../lib/comments/repository').Main;

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('Comment related blockchain transactions.', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organization comments.', () => {
    it('Org. Should create and process valid direct comment creation transaction', async () => {

      await RabbitMqService.purgeBlockchainQueue();
      const user = userVlad;
      const post_id = 1; // post_id = 1 is belong to organization of author vlad

      const expectedBlockchainResponse = {
        "processed": {
          "action_traces": [
            {
              "act": {
                "account": "tst.activity",
                "name": "makecontorg",
                "authorization": [
                  {
                    "actor": user.account_name,
                    "permission": "active"
                  }
                ],
                "data": {
                  "acc": user.account_name,
                  "organization_id": "sample_blockchain_id_1",
                  "content_type_id": 3,
                  "parent_content_id": "pstms1-yed143ojlcdq0dl"
                },
              },
            }
          ],
        }
      };

      await helpers.Comments.requestToCreateComment(post_id, user);

      let activity = null;
      while(!activity) {
        activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.signed_transaction.length).toBeGreaterThan(0);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 20000);

    it('Org. should create and process valid comment on comment creation transaction', async () => {
      await RabbitMqService.purgeBlockchainQueue();
      const user = userVlad;
      const post_id = 1; // post_id = 1 is belong to organization of author vlad
      const parent_comment_id = 1;

      await helpers.Seeds.bulkCreateComments();

      const expectedBlockchainResponse = {
        "processed": {
          "action_traces": [
            {
              "act": {
                "account": "tst.activity",
                "name": "makecontorg",
                "authorization": [
                  {
                    "actor": user.account_name,
                    "permission": "active"
                  }
                ],
                "data": {
                  "acc": user.account_name,
                  "organization_id": "sample_blockchain_id_1",
                  "content_type_id": 3,
                  "parent_content_id": "sample_comment_blockchain_id1"
                },
              },
            }
          ],
        }
      };

      await helpers.Comments.requestToCreateCommentOnComment(post_id, parent_comment_id, user);

      let activity = null;
      while(!activity) {
        activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.signed_transaction.length).toBeGreaterThan(0);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 20000);
  });

  describe('User himself. Comment creation related transaction', function () {
    it('Comment on post without org ID. Should create and process valid transaction.', async () => {
      await RabbitMqService.purgeBlockchainQueue();
      const user = userVlad;

      const expectedBlockchainResponse = {
        "processed": {
          "action_traces": [
            {
              "act": {
                "account": "tst.activity",
                "name": "makecontent",
                "authorization": [
                  {
                    "actor": user.account_name,
                    "permission": "active"
                  }
                ],
                "data": {
                  "acc": user.account_name,
                  "content_type_id": 3,
                  "parent_content_id": "sample_post_blockchain_id"
                },
              },
            }
          ],
        }
      };

      const post = await helpers.Seeds.createMediaPostWithoutOrg(user);

      await helpers.Comments.requestToCreateComment(post.id, user);

      let activity = null;
      while(!activity) {
        activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.signed_transaction.length).toBeGreaterThan(0);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 20000);

    it('Comment on comment without org ID. Should create and process valid transaction.', async () => {
      await RabbitMqService.purgeBlockchainQueue();
      const user = userVlad;

      const expectedBlockchainResponse = {
        "processed": {
          "action_traces": [
            {
              "act": {
                "account": "tst.activity",
                "name": "makecontent",
                "authorization": [
                  {
                    "actor": user.account_name,
                    "permission": "active"
                  }
                ],
                "data": {
                  "acc": user.account_name,
                  "content_type_id": 3,
                  "parent_content_id": "sample_comment_on_post_blockchain_id"
                },
              },
            }
          ],
        }
      };

      const post = await helpers.Seeds.createMediaPostWithoutOrg(user);
      const comment = await helpers.Seeds.createCommentOnPostWithoutOrg(user, post.id);

      await helpers.Comments.requestToCreateCommentOnComment(post.id, comment.id, user);

      let activity = null;
      while(!activity) {
        activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(user.id);
        await delay(100);
      }

      expect(activity.signed_transaction.length).toBeGreaterThan(0);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 10000);
  });

  describe('Comments activity transactions', () => {
    describe('Votes related transactions', function () {
      it('Jane upvotes Vlad posts', async () => {
        const postId  = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await helpers.Comments.requestToUpvoteComment(postId, comment.id, userJane);
        const blockchainId = await CommentsRepository.findBlockchainIdById(comment.id);

        let activity;
        while(!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userJane.id);
          await delay(100);
        }

        const expectedPushResult = helpers.EosTransaction.getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(
          userJane.account_name,
          blockchainId,
          InteractionTypeDictionary.getUpvoteId()
        );

        expect(JSON.parse(activity.signed_transaction)).toMatchObject(helpers.EosTransaction.getPartOfSignedUserVotesPostOfOtherUser());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedPushResult);
      }, 20000);

      it('Jane DOWNVOTES Vlad posts', async () => {
        const postId  = await gen.Posts.createMediaPostByUserHimself(userVlad);
        const comment = await gen.Comments.createCommentForPost(postId, userVlad);

        await helpers.Comments.requestToDownvoteComment(postId, comment.id, userJane);
        const blockchainId = await CommentsRepository.findBlockchainIdById(comment.id);

        let activity;
        while(!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userJane.id);
          await delay(100);
        }

        const expectedPushResult = helpers.EosTransaction.getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(
          userJane.account_name,
          blockchainId,
          InteractionTypeDictionary.getDownvoteId()
        );

        expect(JSON.parse(activity.signed_transaction)).toMatchObject(helpers.EosTransaction.getPartOfSignedUserVotesPostOfOtherUser());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedPushResult);
      }, 20000);
    })
  });
});