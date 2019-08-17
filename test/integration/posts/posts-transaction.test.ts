import PostsGenerator = require('../../generators/posts-generator');
import SeedsHelper = require('../helpers/seeds-helper');
import EosTransactionHelper = require('../helpers/eos-transaction-helpers');
import ActivityHelper = require('../helpers/activity-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsHelper = require('../helpers/posts-helper');
import PostsRepository = require('../../../lib/posts/posts-repository');
import UsersActivityRepository = require('../../../lib/users/repository/users-activity-repository');

const delay = require('delay');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

let userVlad;
let userJane;

describe('Posts related blockchain transactions.', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await SeedsHelper.initPostOfferSeeds();
    await EosTransactionHelper.purgeQueues();
  });

  describe('User creates repost', () => {
    it('should create and process valid transaction', async () => {
      const parentPostAuthor = userVlad;
      const repostAuthor = userJane;

      const postId = await PostsGenerator.createMediaPostByUserHimself(parentPostAuthor);
      await PostsGenerator.createRepostOfUserPost(repostAuthor, postId);

      const parentPost = await PostsRepository.findOnlyPostItselfById(postId);

      let activity;

      while (!activity) {
        activity =
          await UsersActivityRepository.findLastWithBlockchainIsSentStatus(repostAuthor.id);
        await delay(100);
      }

      const expectedSignedTransaction =
        EosTransactionHelper.getPartOfSignedUserCreatesRepost(repostAuthor.account_name);
      const expectedBlockchainResponse  =
        EosTransactionHelper.getPartOfBlockchainResponseOnUserCreatesRepost(
          repostAuthor.account_name,
          parentPost.blockchain_id,
        );

      expect(JSON.parse(activity.signed_transaction)).toMatchObject(expectedSignedTransaction);
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(expectedBlockchainResponse);
    }, 30000);
  });

  describe('User creates direct post', () => {
    it('direct post on user - valid transaction', async () => {
      const postAuthor  = userVlad;

      await PostsGenerator.createUserDirectPostForOtherUser(postAuthor, userJane);

      const activity = await ActivityHelper.requestToWaitAndGetTransaction(postAuthor);

      const expected = {
        signed_transaction:
          EosTransactionHelper.getPartOfSignedUserCreatesDirectPostOfOtherUser(),
        blockchain_response:
          EosTransactionHelper.getPartOfBlockchainResponseOnUserCreatesDirectPostOfOtherUser(),
      };

      EosTransactionHelper.checkTransactionsParts(activity, expected);
    }, 10000);

    it('direct post on organization - valid transaction', async () => {
      const postAuthor  = userVlad;

      const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userJane);
      await PostsGenerator.createDirectPostForOrganizationLegacy(postAuthor, orgId);

      const activity = await ActivityHelper.requestToWaitAndGetTransaction(postAuthor);

      const expected = {
        signed_transaction: EosTransactionHelper.getPartOfSignedUserCreatesDirectPostOfOrg(),
        blockchain_response:
          EosTransactionHelper.getPartOfBlockchainResponseOnUserCreatesDirectPostOfOrg(),
      };

      EosTransactionHelper.checkTransactionsParts(activity, expected);
    }, 30000);
  });

  describe('Organization posting related transactions', () => {
    describe('Positive scenarios', () => {
      it('should create and process new organization media post transaction', async () => {
        const user = userVlad;
        const orgId = 1;
        let activity: any = null;

        await PostsGenerator.createMediaPostOfOrganization(user, orgId);
        while (!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userVlad.id);
          await delay(100);
        }

        expect(JSON.parse(activity.signed_transaction))
          .toMatchObject(EosTransactionHelper.getPartOfSignedOrgCreatesMediaPostTransaction());
        expect(JSON.parse(activity.blockchain_response))
          .toMatchObject(EosTransactionHelper.getPartOfBlockchainResponseOnOrgCreatesMediaPost());
      }, 20000);
    });

    it.skip('should create and process new organization post offer transaction', async () => {
    });
  });

  describe('Posts activity transactions', () => {
    describe('Votes related transactions', () => {
      it('Jane upvotes Vlad posts', async () => {
        const postId  = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        await PostsHelper.requestToUpvotePost(userJane, postId);

        const blockchainId = await PostsRepository.findBlockchainIdById(postId);

        let activity;
        while (!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userJane.id);
          await delay(100);
        }

        const expectedPushResult =
          EosTransactionHelper.getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(
            userJane.account_name,
            blockchainId,
          );

        expect(JSON.parse(activity.signed_transaction))
          .toMatchObject(EosTransactionHelper.getPartOfSignedUserVotesPostOfOtherUser());
        expect(JSON.parse(activity.blockchain_response))
          .toMatchObject(expectedPushResult);
      }, 10000);

      it('Jane downvotes Vlad posts', async () => {
        const postId  = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        await PostsHelper.requestToDownvotePost(userJane, postId);

        const blockchainId = await PostsRepository.findBlockchainIdById(postId);

        let activity;
        while (!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userJane.id);
          await delay(100);
        }

        const expectedPushResult =
          EosTransactionHelper.getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(
            userJane.account_name,
            blockchainId,
          );

        expect(JSON.parse(activity.signed_transaction))
          .toMatchObject(EosTransactionHelper.getPartOfSignedUserVotesPostOfOtherUser());
        expect(JSON.parse(activity.blockchain_response))
          .toMatchObject(expectedPushResult);
      }, 20000);
    });
  });

  describe('User himself creates post.', () => {
    describe('Positive scenarios', () => {
      it('User himself. New media post.', async () => {
        const user = userVlad;
        let activity: any = null;

        await PostsGenerator.createMediaPostByUserHimself(user);
        while (!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userVlad.id);
          await delay(100);
        }

        const postTypeId = ContentTypeDictionary.getTypeMediaPost();

        expect(JSON.parse(activity.signed_transaction)).toMatchObject(
          EosTransactionHelper.getPartOfSignedUserHimselfCreatesMediaPostTransaction(),
        );
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(
          EosTransactionHelper.getPartOfBlockchainResponseOnUserCreatesMediaPost(postTypeId),
        );
      }, 20000);
    });

    it('should create and process new organization post offer transaction', async () => {
      const user = userVlad;
      let activity: any = null;

      await PostsGenerator.createPostOfferByUserHimself(user);
      while (!activity) {
        activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userVlad.id);
        await delay(100);
      }

      const postTypeId = ContentTypeDictionary.getTypeOffer();

      expect(JSON.parse(activity.signed_transaction)).toMatchObject(
        EosTransactionHelper.getPartOfSignedUserHimselfCreatesMediaPostTransaction(),
      );
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(
        EosTransactionHelper.getPartOfBlockchainResponseOnUserCreatesMediaPost(postTypeId),
      );
    }, 20000);
  });
});

export {};
