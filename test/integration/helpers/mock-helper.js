const UserActivityService = require('../../../lib/users/user-activity-service');
const CommentsService = require('../../../lib/comments/comments-service');
const OrganizationService = require('../../../lib/organizations/service/organization-service');
const UsersToOrgActivity = require('../../../lib/users/activity/user-to-organization-activity');
const PostsService = require('../../../lib/posts/post-service');
const ActivityProducer = require('../../../lib/jobs/activity-producer');

const EosTransactionService = require('../../../lib/eos/eos-transaction-service');

class MockHelper {

  static mockAllTransactionSigning() {

    this.mockPostTransactionSigning();
    this.mockUsersActivityBackendSigner();
    this.mockCommentTransactionSigning();
    this.mockOrganizationBlockchain();
    this.mockOrganizationFollowingSigning();

    this.mockUserVotesPost();
  }

  static mockAllBlockchainJobProducers() {
    // TODO - only organization now. In process
    this.mockOrganizationCreationBlockchainProducer();
  }

  static mockAllBlockchainPart() {

    this.mockAllTransactionSigning();

    this.mockBlockchainPart();
    this.mockSendingToQueue();
  }

  static mockOrganizationCreationBlockchainProducer() {
    // noinspection JSUnusedLocalSymbols
    OrganizationService._sendOrgCreationActivityToRabbit = async function(newUserActivity) {}
  }

  static mockUsersActivityBackendSigner() {
    // noinspection JSUnusedLocalSymbols
    UserActivityService._getSignedFollowTransaction = async function(userFrom, userToAccountName, activityTypeId) {
      // console.log('MOCK UserActivityService._getSignedFollowTransaction is called');

      return 'sample_signed_transaction';
    }
  }

  static mockCommentTransactionSigning() {
    // noinspection JSUnusedLocalSymbols
    CommentsService._addTransactionDataToBody = async function (
      body,
      currentUser,
      parentModelBlockchainId,
      isCommentOnComment,
      organizationBlockchainId = null
    ) {

      body.blockchain_id  = 'new_comment_sample_blockchain_id';
      body.sign           = 'example_sign';

      body.signed_transaction = 'sample_signed_transaction_for_comment_creation';
    };
  }

  static mockSendingToQueue() {
    // noinspection JSUnusedLocalSymbols
    ActivityProducer.publish = async function (message, bindingKey) {
      return true;
    }
  }

  static mockPostTransactionSigning() {
    PostsService._addSignedTransactionDetailsToBody = async function(
      body,
      user,
      postTypeId,
      organizationBlockchainId = null
    ) {
      if (organizationBlockchainId) {
        body.blockchain_id = 'sample_new_org_post_blockchain_id';
        body.signed_transaction = 'sample_new_org_post_transaction';
      } else {
        body.blockchain_id = 'sample_user_himself_new_post_blockchain_id';
        body.signed_transaction = 'sample_user_himself_new_post_transaction';
      }
    };

    // noinspection JSUnusedLocalSymbols
    EosTransactionService.appendSignedUserCreatesRepost = function (body, user, parentContentBlockchainId) {
      body.blockchain_id = 'sample_blockchain_id';
      body.signed_transaction = 'sample_signed_transaction';
    };

    // noinspection JSUnusedLocalSymbols
    EosTransactionService.appendSignedUserCreatesDirectPostForOtherUser = function (body, user, accountNameTo) {
      body.blockchain_id = 'sample_blockchain_id';

      body.signed_transaction = 'sample_signed_transaction';
    };

    // noinspection JSUnusedLocalSymbols
    EosTransactionService.appendSignedUserCreatesDirectPostForOrg = function (body, user, orgBlockchainIdTo) {
      body.blockchain_id = 'sample_blockchain_id';

      body.signed_transaction = 'sample_signed_transaction';
    }
  }

  static mockOrganizationBlockchain() {
    OrganizationService._addSignedTransactionsForOrganizationCreation = async function (req) {
      // console.log('MOCK add signed transaction is called');

      req.blockchain_id = 'sample_blockchain_id';
      req.signed_transaction = 'sample_signed_transaction';
    };
  }

  static mockUserVotesPost() {
    // noinspection JSUnusedLocalSymbols
    EosTransactionService.appendSignedUserVotesContent = function (user, body, contentBlockchainId, activityTypeId) {
      body.signed_transaction = 'sample_signed_for_content_voting';
    };
  }

  static mockOrganizationFollowingSigning() {
    // noinspection JSUnusedLocalSymbols
    UsersToOrgActivity._addSignedTransactionsForOrganizationFollowing = async function (body, currentUser, activityTypeId) {
      // console.log('MOCK add signed transaction is called');
      body.signed_transaction = 'sample_signed_transaction';
    };
  }

  static mockBlockchainPart() {
    // noinspection JSUnusedLocalSymbols
    UserActivityService._sendPayloadToRabbit = function (activity, scope) {
      // console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    // noinspection JSUnusedLocalSymbols
    UserActivityService.sendPayloadToRabbit = function (activity, scope) {
      // console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    this.mockOrganizationBlockchain();
    this.mockOrganizationFollowingSigning();
  }
}

module.exports = MockHelper;