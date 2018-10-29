const helpers = require('../helpers');
const delay = require('delay');
const gen     = require('../../generators');

const UsersActivityRepository = require('../../../lib/users/repository').Activity;
const { ContentTypeDictionary, InteractionTypeDictionary } = require('uos-app-transaction');

const PostsRepository = require('../../../lib/posts/repository').Main;

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('Posts related blockchain transactions.', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initPostOfferSeeds();
    await helpers.EosTransaction.purgeQueues();
  });

  describe('Organization posting related transactions', () => {
    describe('Positive scenarios', () => {
      it('should create and process new organization media post transaction', async () => {

        const user = userVlad;
        const org_id = 1;
        let activity = null;

        await helpers.Post.requestToCreateMediaPostOfOrganization(user, org_id);
        while(!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userVlad.id);
          await delay(100);
        }

        expect(JSON.parse(activity.signed_transaction)).toMatchObject(helpers.EosTransaction.getPartOfSignedOrgCreatesMediaPostTransaction());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(helpers.EosTransaction.getPartOfBlockchainResponseOnOrgCreatesMediaPost());
      }, 20000);
    });

    // it('should create and process new organization post offer transaction', async () => {
    //   // TODO
    // });
  });

  describe('Posts activity transactions', () => {

    describe('Votes related transactions', function () {
      it('Jane upvotes Vlad posts', async () => {
        const postId  = await gen.Posts.createMediaPostByUserHimself(userVlad);
        await helpers.PostHelper.requestToUpvotePost(userJane, postId);

        const blockchainId = await PostsRepository.findBlockchainIdById(postId);

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
      }, 10000);

      it('Jane downvotes Vlad posts', async () => {
        const postId  = await gen.Posts.createMediaPostByUserHimself(userVlad);
        await helpers.PostHelper.requestToDownvotePost(userJane, postId);

        const blockchainId = await PostsRepository.findBlockchainIdById(postId);

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
      }, 10000);
    });
  });

  describe('User himself creates post.', () => {
    describe('Positive scenarios', () => {
      it('User himself. New media post.', async () => {
        const user = userVlad;
        let activity = null;

        await helpers.Post.requestToCreateMediaPost(user);
        while(!activity) {
          activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userVlad.id);
          await delay(100);
        }

        const postTypeId = ContentTypeDictionary.getTypeMediaPost();

        expect(JSON.parse(activity.signed_transaction)).toMatchObject(helpers.EosTransaction.getPartOfSignedUserHimselfCreatesMediaPostTransaction());
        expect(JSON.parse(activity.blockchain_response)).toMatchObject(helpers.EosTransaction.getPartOfBlockchainResponseOnUserCreatesMediaPost(postTypeId));
      }, 20000);
    });

    it('should create and process new organization post offer transaction', async () => {
      const user = userVlad;
      let activity = null;

      await helpers.Post.requestToCreatePostOffer(user);
      while(!activity) {
        activity = await UsersActivityRepository.findLastWithBlockchainIsSentStatus(userVlad.id);
        await delay(100);
      }

      const postTypeId = ContentTypeDictionary.getTypeOffer();

      expect(JSON.parse(activity.signed_transaction)).toMatchObject(helpers.EosTransaction.getPartOfSignedUserHimselfCreatesMediaPostTransaction());
      expect(JSON.parse(activity.blockchain_response)).toMatchObject(helpers.EosTransaction.getPartOfBlockchainResponseOnUserCreatesMediaPost(postTypeId));
    }, 20000);
  })

});