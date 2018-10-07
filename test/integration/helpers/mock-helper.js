const UserActivityService = require('../../../lib/users/user-activity-service');
const CommentsService = require('../../../lib/comments/comments-service');
const OrganizationService = require('../../../lib/organizations/service/organization-service');
const UsersToOrgActivity = require('../../../lib/users/activity/user-to-organization-activity');
const PostsService = require('../../../lib/posts/post-service');

class MockHelper {
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
  }

  static mockBlockchainPart() {
    // noinspection JSUnusedLocalSymbols
    UserActivityService._sendPayloadToRabbit = function (activity, scope) {
      console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    // noinspection JSUnusedLocalSymbols
    UserActivityService.sendPayloadToRabbit = function (activity, scope) {
      console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    OrganizationService._addSignedTransactionsForOrganizationCreation = async function (req) {
      console.log('MOCK add signed transaction is called');

      req.blockchain_id = 'sample_blockchain_id';
      req.signed_transaction = 'sample_signed_transaction';
    };

    // noinspection JSUnusedLocalSymbols
    UsersToOrgActivity._addSignedTransactionsForOrganizationFollowing = async function (body, currentUser, activityTypeId) {
      console.log('MOCK add signed transaction is called');
      body.signed_transaction = 'sample_signed_transaction';
    };

    // noinspection JSUnusedLocalSymbols
    CommentsService._createSignedTransactionOrgCreatesComment = async function (currentUser, orgBlockchainId, newComment, parentCommentBlockchainId) {
      console.log('MOCK add signed transaction is called');

      return 'sample_signed_transaction_for_org_creates_comment';
    };
  }
}

module.exports = MockHelper;