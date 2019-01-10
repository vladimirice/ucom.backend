/* tslint:disable:max-line-length */
const userActivityService = require('../../../lib/users/user-activity-service');
const commentsService = require('../../../lib/comments/comments-service');
const organizationService = require('../../../lib/organizations/service/organization-service');
const usersToOrgActivity = require('../../../lib/users/activity/user-to-organization-activity');
const postsService = require('../../../lib/posts/post-service');
const activityProducer = require('../../../lib/jobs/activity-producer');

const eosTransactionService = require('../../../lib/eos/eos-transaction-service');

let orgCounter = 1;
let postCreationCounter = 1;

class MockHelper {

  static mockAllTransactionSigning() {
    orgCounter = 1;
    postCreationCounter = 1;

    this.mockPostTransactionSigning();
    this.mockUsersActivityBackendSigner();
    this.mockCommentTransactionSigning();
    this.mockOrganizationBlockchain();
    this.mockOrganizationFollowingSigning();

    this.mockUserVotesPost();
  }

  static mockAllBlockchainJobProducers() {
    // #task - only organization now. In process
    this.mockOrganizationCreationBlockchainProducer();
  }

  static mockAllBlockchainPart() {

    this.mockAllTransactionSigning();

    this.mockBlockchainPart();
    this.mockSendingToQueue();
  }

  static mockOrganizationCreationBlockchainProducer() {
    // noinspection JSUnusedLocalSymbols
    // @ts-ignore
    organizationService._sendOrgCreationActivityToRabbit = async function (newUserActivity) {};
  }

  static mockUsersActivityBackendSigner() {
    // noinspection JSUnusedLocalSymbols
    // @ts-ignore
    userActivityService._getSignedFollowTransaction = async function (userFrom, userToAccountName, activityTypeId) {
      // console.log('MOCK UserActivityService._getSignedFollowTransaction is called');

      return 'sample_signed_transaction';
    };
  }

  static mockCommentTransactionSigning() {
    // noinspection JSUnusedLocalSymbols
    // @ts-ignore
    commentsService._addTransactionDataToBody = async function (
      body,
      // @ts-ignore
      currentUser,
      // @ts-ignore
      parentModelBlockchainId,
      // @ts-ignore
      isCommentOnComment,
      // @ts-ignore
      organizationBlockchainId = null,
    ) {

      body.blockchain_id  = 'new_comment_sample_blockchain_id';
      body.sign           = 'example_sign';

      body.signed_transaction = 'sample_signed_transaction_for_comment_creation';
    };
  }

  static mockSendingToQueue() {
    // noinspection JSUnusedLocalSymbols
    activityProducer.publish = async function (
      // @ts-ignore
      message,
      // @ts-ignore
      bindingKey,
    ) {
      return true;
    };
  }

  static mockPostTransactionSigning() {
    postsService._addSignedTransactionDetailsToBody = async function (
      body,
      // @ts-ignore
      user,
      // @ts-ignore
      postTypeId,
      organizationBlockchainId = null,
    ) {
      if (organizationBlockchainId) {
        body.blockchain_id = `sample_new_org_post_blockchain_id_${postCreationCounter}`;
        body.signed_transaction = 'sample_new_org_post_transaction';
      } else {
        body.blockchain_id = `sample_user_himself_new_post_blockchain_id_${postCreationCounter}`;
        body.signed_transaction = 'sample_user_himself_new_post_transaction';
      }

      postCreationCounter += 1;
    };

    // noinspection JSUnusedLocalSymbols
    eosTransactionService.appendSignedUserCreatesRepost = function (
      body,
      // @ts-ignore
      user,
      // @ts-ignore
      parentContentBlockchainId,
    ) {
      body.blockchain_id = 'sample_blockchain_id';
      body.signed_transaction = 'sample_signed_transaction';
    };

    // noinspection JSUnusedLocalSymbols
    eosTransactionService.appendSignedUserCreatesDirectPostForOtherUser = function (
      body,
      // @ts-ignore
      user,
      // @ts-ignore
      accountNameTo,
    ) {
      body.blockchain_id = 'sample_blockchain_id';

      body.signed_transaction = 'sample_signed_transaction';
    };

    // noinspection JSUnusedLocalSymbols
    eosTransactionService.appendSignedUserCreatesDirectPostForOrg = function (
      body,
      // @ts-ignore
      user,
      // @ts-ignore
      orgBlockchainIdTo,
    ) {
      body.blockchain_id = 'sample_blockchain_id';

      body.signed_transaction = 'sample_signed_transaction';
    };
  }

  static mockOrganizationBlockchain() {
    organizationService._addSignedTransactionsForOrganizationCreation = async function (req) {
      req.blockchain_id = `sample_blockchain_id_${orgCounter}`;
      req.signed_transaction = 'sample_signed_transaction';

      orgCounter += 1;
    };
  }

  static mockUserVotesPost() {
    // noinspection JSUnusedLocalSymbols
    eosTransactionService.appendSignedUserVotesContent = function (
      // @ts-ignore
      user,
      body,
      // @ts-ignore
      contentBlockchainId,
      // @ts-ignore
      activityTypeId,
    ) {
      body.signed_transaction = 'sample_signed_for_content_voting';
    };
  }

  static mockOrganizationFollowingSigning() {
    // noinspection JSUnusedLocalSymbols
    usersToOrgActivity._addSignedTransactionsForOrganizationFollowing = async function (
      body,
      // @ts-ignore
      currentUser,
      // @ts-ignore
      activityTypeId,
    ) {
      // console.log('MOCK add signed transaction is called');
      body.signed_transaction = 'sample_signed_transaction';
    };
  }

  static mockBlockchainPart() {
    // noinspection JSUnusedLocalSymbols
    userActivityService._sendPayloadToRabbit = function (
      // @ts-ignore
      activity,
      // @ts-ignore
      scope,
    ) {
      // console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    // noinspection JSUnusedLocalSymbols
    userActivityService.sendPayloadToRabbit = function (
      // @ts-ignore
      activity,
      // @ts-ignore
      scope,
    ) {
      // console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    this.mockOrganizationBlockchain();
    this.mockOrganizationFollowingSigning();
  }
}

export = MockHelper;
