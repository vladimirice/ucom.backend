class EosTransactionHelper {
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
          "net_usage_words": 16
        },
        "net_usage": 128,
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