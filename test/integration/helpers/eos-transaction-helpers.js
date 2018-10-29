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
  static getPartOfSignedUserVotesPostOfOtherUser() {
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
              "name": "usertocont",
              "authorization": [
                {
                  "actor": "jane",
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

  /**
   *
   * @param {string} accountName
   * @param {string} blockchainId
   * @param {number} interactionTypeId
   * @return {{processed: {receipt: {status: string}, scheduled: boolean, action_traces: {receipt: {receiver: string}, act: {account: string, name: string, authorization: {actor: string, permission: string}[], data: {acc: string, content_id: *}}, cpu_usage: number, total_cpu_usage: number, inline_traces: Array}[], except: null}}}
   */
  static getPartOfBlockchainResponseOnUserUpvotesPostOfOtherUser(accountName, blockchainId, interactionTypeId) {
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
              "name": "usertocont",
              "authorization": [
                {
                  "actor": accountName,
                  "permission": "active"
                }
              ],
              "data": {
                "acc": accountName,
                "content_id": blockchainId,
              },
            },
            "console": `usertocont acc = ${accountName} content_id = ${blockchainId} interaction_type_id = ${interactionTypeId}`,
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