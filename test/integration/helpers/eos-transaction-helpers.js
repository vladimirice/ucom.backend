const UserActivityService = require('../../../lib/users/user-activity-service');
const CommentsService = require('../../../lib/comments/comments-service');
const UsersActivityService = require('../../../lib/users/user-activity-service');
const ActivityProducer = require('../../../lib/jobs/activity-producer');

class EosTransactionHelper {
  static mockUsersActivityBackendSigner() {
    // noinspection JSUnusedLocalSymbols
    UserActivityService._getSignedFollowTransaction = async function(userFrom, userToAccountName, activityTypeId) {
      // console.log('MOCK UserActivityService._getSignedFollowTransaction is called');

      return 'sample_signed_transaction';
    }
  }

  static mockUserActivitySendToRabbit() {
    // noinspection JSUnusedLocalSymbols
    UserActivityService._sendPayloadToRabbit = function (activity, scope) {
      // console.log('SEND TO RABBIT MOCK IS CALLED');
    };
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

  static mockPostTransactionSigning() {
    // noinspection JSUnusedLocalSymbols
    UsersActivityService.createAndSignOrganizationCreatesPostTransaction = async function (
      userFrom,
      organizationBlockchainId,
      postBlockchainId,
      postTypeId
    ) {
      return 'sample_signed_transaction_for_post_creation';
    }
  }

  static mockSendingToQueue() {
    // noinspection JSUnusedLocalSymbols
    ActivityProducer.publish = async function (message, bindingKey) {
      return true;
    }
  }

  /**
   *
   * @return {Object}
   */
  static getPartOfSignedOrgTransaction() {
    return {
      "broadcast": false,
      "transaction": {
        "compression": "none",
        "transaction": {
          "max_net_usage_words": 0,
          "max_cpu_usage_ms": 0,
          "delay_sec": 0,
          "context_free_actions": [],
          "actions": [
            {
              "account": "tst.activity",
              "name": "makecontent",
              "authorization": [
                {
                  "actor": "vlad",
                  "permission": "active"
                }
              ],
            }
          ],
          "transaction_extensions": []
        },
      }
    };
  }

  static getPartOfSignedOrgCreatesMediaPostTransaction() {
    return {
      "broadcast": false,
      "transaction": {
        "compression": "none",
        "transaction": {
          "max_net_usage_words": 0,
          "max_cpu_usage_ms": 0,
          "delay_sec": 0,
          "context_free_actions": [],
          "actions": [
            {
              "account": "tst.activity",
              "name": "makecontorg",
              "authorization": [
                {
                  "actor": "vlad",
                  "permission": "active"
                }
              ],
            }
          ],
          "transaction_extensions": []
        },
      }
    };

  }
  /**
   *
   * @return {Object}
   */
  static getPartOfBlockchainResponseOnOrgCreation() {
    return {
      "processed": {
        "receipt": {
          "status": "executed",
        },
        "scheduled": false,
        "action_traces": [
          {
            "receipt": {
              "receiver": "tst.activity",
            },
            "act": {
              "account": "tst.activity",
              "name": "makecontent",
              "authorization": [
                {
                  "actor": "vlad",
                  "permission": "active"
                }
              ],
              "data": {
                "acc": "vlad",
                "content_type_id": 4,
                "parent_content_id": "",
              },
            },
            "cpu_usage": 0,
            "total_cpu_usage": 0,
            "inline_traces": []
          }
        ],
        "except": null
      }
    };
  }

  static getPartOfBlockchainResponseOnOrgCreatesMediaPost() {
    return {
      "processed": {
        "receipt": {
          "status": "executed",
          "net_usage_words": 19
        },
        "net_usage": 152,
        "scheduled": false,
        "action_traces": [
          {
            "receipt": {
              "receiver": "tst.activity",
              // "code_sequence": 1,
              // "abi_sequence": 1
            },
            "act": {
              "account": "tst.activity",
              "name": "makecontorg",
              "authorization": [
                {
                  "actor": "vlad",
                  "permission": "active"
                }
              ],
              "data": {
                "acc": "vlad",
                "content_type_id": 1,
                "parent_content_id": "",
              },
            },
            "cpu_usage": 0,
            "total_cpu_usage": 0,
            "inline_traces": []
          }
        ],
        "except": null
      }
    };
  }
}

module.exports = EosTransactionHelper;