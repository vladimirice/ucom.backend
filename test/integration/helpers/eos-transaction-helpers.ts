/* tslint:disable:max-line-length */
const accountsData = require('../../../../secrets/accounts-data');

const rabbitMqService = require('../../../lib/jobs/rabbitmq-service');

class EosTransactionHelper {
  static async purgeQueues() {
    await Promise.all([
      rabbitMqService.purgeBlockchainQueue(),
      // RabbitMqService.purgeIpfsQueue()
    ]);
  }

  /**
   *
   * @param {Object} activity
   * @param {Object} expected
   */
  static checkTransactionsParts(activity, expected) {
    expect(JSON.parse(activity.signed_transaction)).toMatchObject(expected.signed_transaction);
    expect(JSON.parse(activity.blockchain_response)).toMatchObject(expected.blockchain_response);
  }

  /**
   *
   * @return {Object}
   */
  static getPartOfSignedOrgTransaction() {
    return {
      broadcast: false,
      transaction: {
        compression: 'none',
        transaction: {
          max_net_usage_words: 0,
          max_cpu_usage_ms: 0,
          delay_sec: 0,
          context_free_actions: [],
          actions: [
            {
              account: 'tst.activity',
              name: 'makecontent',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
            },
          ],
          transaction_extensions: [],
        },
      },
    };
  }

  static getPartOfSignedOrgCreatesMediaPostTransaction() {
    return {
      broadcast: false,
      transaction: {
        compression: 'none',
        transaction: {
          max_net_usage_words: 0,
          max_cpu_usage_ms: 0,
          delay_sec: 0,
          context_free_actions: [],
          actions: [
            {
              account: 'tst.activity',
              name: 'makecontorg',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
            },
          ],
          transaction_extensions: [],
        },
      },
    };
  }

  static getPartOfSignedUserCreatesDirectPostOfOtherUser() {
    return {
      broadcast: false,
      transaction: {
        compression: 'none',
        transaction: {
          max_net_usage_words: 0,
          max_cpu_usage_ms: 0,
          delay_sec: 0,
          context_free_actions: [],
          actions: [
            {
              account: 'tst.activity',
              name: 'dirpost',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
            },
          ],
          transaction_extensions: [],
        },
      },
    };
  }

  static getPartOfSignedUserCreatesDirectPostOfOrg() {
    return {
      broadcast: false,
      transaction: {
        compression: 'none',
        transaction: {
          max_net_usage_words: 0,
          max_cpu_usage_ms: 0,
          delay_sec: 0,
          context_free_actions: [],
          actions: [
            {
              account: 'tst.activity',
              name: 'dirpostorg',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
            },
          ],
          transaction_extensions: [],
        },
      },
    };
  }

  static getPartOfSignedUserCreatesRepost(actorAccountName) {
    return {
      broadcast: false,
      transaction: {
        compression: 'none',
        transaction: {
          max_net_usage_words: 0,
          max_cpu_usage_ms: 0,
          delay_sec: 0,
          context_free_actions: [],
          actions: [
            {
              account: 'tst.activity',
              name: 'makecontent',
              authorization: [
                {
                  actor: actorAccountName,
                  permission: 'active',
                },
              ],
            },
          ],
          transaction_extensions: [],
        },
      },
    };
  }

  // eslint-disable-next-line sonarjs/no-identical-functions
  static getPartOfSignedUserHimselfCreatesMediaPostTransaction() {
    return {
      broadcast: false,
      transaction: {
        compression: 'none',
        transaction: {
          max_net_usage_words: 0,
          max_cpu_usage_ms: 0,
          delay_sec: 0,
          context_free_actions: [],
          actions: [
            {
              account: 'tst.activity',
              name: 'makecontent',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
            },
          ],
          transaction_extensions: [],
        },
      },
    };
  }

  static getPartOfSignedUserVotesPostOfOtherUser() {
    return {
      broadcast: false,
      transaction: {
        compression: 'none',
        transaction: {
          max_net_usage_words: 0,
          max_cpu_usage_ms: 0,
          delay_sec: 0,
          context_free_actions: [],
          actions: [
            {
              account: 'tst.activity',
              name: 'usertocont',
              authorization: [
                {
                  actor: accountsData.jane.account_name,
                  permission: 'active',
                },
              ],
            },
          ],
          transaction_extensions: [],
        },
      },
    };
  }

  /**
   *
   * @return {Object}
   */
  static getPartOfBlockchainResponseOnOrgCreation() {
    return {
      processed: {
        receipt: {
          status: 'executed',
        },
        scheduled: false,
        action_traces: [
          {
            receipt: {
              receiver: 'tst.activity',
            },
            act: {
              account: 'tst.activity',
              name: 'makecontent',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
              data: {
                acc: accountsData.vlad.account_name,
                content_type_id: 4,
                parent_content_id: '',
              },
            },
            inline_traces: [],
          },
        ],
        except: null,
      },
    };
  }

  static getPartOfBlockchainResponseOnOrgCreatesMediaPost() {
    return {
      processed: {
        receipt: {
          status: 'executed',
        },
        scheduled: false,
        action_traces: [
          {
            receipt: {
              receiver: 'tst.activity',
            },
            act: {
              account: 'tst.activity',
              name: 'makecontorg',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
              data: {
                acc: accountsData.vlad.account_name,
                content_type_id: 1,
                parent_content_id: '',
              },
            },
            inline_traces: [],
          },
        ],
        except: null,
      },
    };
  }

  static getPartOfBlockchainResponseOnUserCreatesDirectPostOfOtherUser() {
    return {
      processed: {
        receipt: {
          status: 'executed',
        },
        scheduled: false,
        action_traces: [
          {
            receipt: {
              receiver: 'tst.activity',
            },
            act: {
              account: 'tst.activity',
              name: 'dirpost',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
              data: {
                acc: accountsData.vlad.account_name,
                content_type_id: 10,
              },
            },
            inline_traces: [],
          },
        ],
        except: null,
      },
    };
  }

  static getPartOfBlockchainResponseOnUserCreatesDirectPostOfOrg() {
    return {
      processed: {
        receipt: {
          status: 'executed',
        },
        scheduled: false,
        action_traces: [
          {
            receipt: {
              receiver: 'tst.activity',
            },
            act: {
              account: 'tst.activity',
              name: 'dirpostorg',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
              data: {
                acc: accountsData.vlad.account_name,
                content_type_id: 10,
              },
            },
            inline_traces: [],
          },
        ],
        except: null,
      },
    };
  }

  static getPartOfBlockchainResponseOnUserCreatesRepost(actorAccountName, parentBlockchainId) {
    return {
      processed: {
        receipt: {
          status: 'executed',
        },
        scheduled: false,
        action_traces: [
          {
            receipt: {
              receiver: 'tst.activity',
            },
            act: {
              account: 'tst.activity',
              name: 'makecontent',
              authorization: [
                {
                  actor: actorAccountName,
                  permission: 'active',
                },
              ],
              data: {
                acc: actorAccountName,
                content_type_id: 11,
                parent_content_id: parentBlockchainId,
              },
            },
            inline_traces: [],
          },
        ],
        except: null,
      },
    };
  }

  static getPartOfBlockchainResponseOnUserCreatesMediaPost(postTypeId) {
    return {
      processed: {
        receipt: {
          status: 'executed',
        },
        scheduled: false,
        action_traces: [
          {
            receipt: {
              receiver: 'tst.activity',
            },
            act: {
              account: 'tst.activity',
              name: 'makecontent',
              authorization: [
                {
                  actor: accountsData.vlad.account_name,
                  permission: 'active',
                },
              ],
              data: {
                acc: accountsData.vlad.account_name,
                content_type_id: postTypeId,
                parent_content_id: '',
              },
            },
            inline_traces: [],
          },
        ],
        except: null,
      },
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
      processed: {
        receipt: {
          status: 'executed',
        },
        scheduled: false,
        action_traces: [
          {
            receipt: {
              receiver: 'tst.activity',
            },
            act: {
              account: 'tst.activity',
              name: 'usertocont',
              authorization: [
                {
                  actor: accountName,
                  permission: 'active',
                },
              ],
              data: {
                acc: accountName,
                content_id: blockchainId,
              },
            },
            console: `usertocont acc = ${accountName} content_id = ${blockchainId} interaction_type_id = ${interactionTypeId}`,
            inline_traces: [],
          },
        ],
        except: null,
      },
    };
  }
}

export = EosTransactionHelper;
