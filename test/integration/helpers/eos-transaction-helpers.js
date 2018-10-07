const UserActivityService = require('../../../lib/users/user-activity-service');
const CommentsService = require('../../../lib/comments/comments-service');
const UsersActivityService = require('../../../lib/users/user-activity-service');
const PostsService = require('../../../lib/posts/post-service');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');

class EosTransactionHelper {
  static async purgeQueues() {
    await Promise.all([
      RabbitMqService.purgeBlockchainQueue(),
      RabbitMqService.purgeIpfsQueue()
    ]);
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
  static getPartOfSignedUserHimselfCreatesMediaPostTransaction() {
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
        },
        "scheduled": false,
        "action_traces": [
          {
            "receipt": {
              "receiver": "tst.activity",
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
  static getPartOfBlockchainResponseOnUserCreatesMediaPost(postTypeId) {
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
                "content_type_id": postTypeId,
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