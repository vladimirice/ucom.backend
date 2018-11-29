const BlockchainCacheService    = require('./blockchain-cache-service');
const BlockchainApiFetchService = require('./blockchain-api-fetch-service');
const BlockchainTrTracesService = require('./blockchain-tr-traces-service');

const TR_TYPE__TRANSFER_FROM  = 10;
const TR_TYPE__TRANSFER_TO    = 11;
const TR_TYPE_STAKE_RESOURCES = 20;

const TR_TYPE_UNSTAKING_REQUEST = 30;
const TR_TYPE_VOTE_FOR_BP       = 40;

const TR_TYPE_CLAIM_EMISSION    = 50;

const CURRENCY__UOS = 'UOS';

class BlockchainService {
  /**
   *
   * @param {Object} currentUser
   */
  constructor(currentUser) {
    this.currentUser = currentUser;
  }


// Use connect method to connect to the Server
//     client.connect(function(err) {
//       console.log("Connected successfully to server");
//
//       const db = client.db(dbName);
//
//       client.close();
//     });

  async getAndProcessMyselfBlockchainTransactions() {

    await BlockchainTrTracesService.getTransferTransactions();

    // const currentUserId = this.currentUser.id;

    const data = [
      {
        tr_type: TR_TYPE_UNSTAKING_REQUEST,
        updated_at: '2018-11-27 12:00:00Z',
        resources: {
          cpu: {
            unstaking_request: {
              amount: 10,
              currency: CURRENCY__UOS,
              request_datetime: '2018-11-25 10:00:00Z',
              unstaked_on_datetime: '2018-11-29 10:00:00Z',
            },
          },
          net: {
            unstaking_request: {
              amount: 0,
              currency: CURRENCY__UOS,
              request_datetime: '2018-11-25 10:00:00Z',
              unstaked_on_datetime: '2018-11-29 10:00:00Z',
            },
          }
        },
      },
      {
        tr_type: TR_TYPE_STAKE_RESOURCES,
        updated_at: '2018-11-27 09:03:00Z',
        resources: {
          cpu: {
            tokens: {
              self_delegated: 2,
              currency: CURRENCY__UOS,
            },
          },
          net: {
            tokens: {
              self_delegated: 10,
              currency: CURRENCY__UOS,
            },
          },
        },
      },
      {
        tr_type: TR_TYPE_STAKE_RESOURCES,
        updated_at: '2018-11-26 18:00:20Z',
        resources: {
          cpu: {
            tokens: {
              self_delegated: 0,
              currency: CURRENCY__UOS,
            },
          },
          net: {
            tokens: {
              self_delegated: 10,
              currency: CURRENCY__UOS,
            },
          },
        },
      },
      {
        tr_type: TR_TYPE__TRANSFER_FROM,
        updated_at: '2018-11-26 8:00:00Z',
        User: {
          'id': 1,
          'account_name': 'super_user_1',
          'first_name': null,
          'last_name': null,
          'nickname': 'super_user_1',
          'avatar_filename': null,
          'current_rate': 500.02
        },
        memo: 'hello memo',
        tokens: {
          active: 100,
          currency: CURRENCY__UOS,
        }
      },
      {
        tr_type: TR_TYPE_VOTE_FOR_BP,
        updated_at: '2018-11-26 04:00:00Z',
        producers: [
          'calc1',
          'calc2',
          'calc3',
        ],
      },
      {
        tr_type: TR_TYPE_CLAIM_EMISSION,
        updated_at: '2018-11-26 04:00:00Z',
        tokens: {
          emission: 250,
          currency: CURRENCY__UOS,
        },
      },
      {
        tr_type: TR_TYPE__TRANSFER_TO,
        updated_at: '2018-11-25 14:02:00Z',
        User: {
          'id': 2,
          'account_name': 'super_user_2',
          'first_name': null,
          'last_name': null,
          'nickname': 'super_user_2',
          'avatar_filename': null,
          'current_rate': 6120.02
        },
        memo: 'hello memo',
        tokens: {
          active: 50,
          currency: CURRENCY__UOS,
        }
      },
    ];

    const metadata = {
      page: 1,
      per_page: 100,
      has_more: false,
      total_amount: data.length,
    };

    return {
      data,
      metadata,
    }
  }

  /**
   * API method
   * @return {Object}
   */
  async getAndProcessNodes(query) {
    const userId = this.currentUser.id;

    return await BlockchainApiFetchService.getAndProcessNodes(query, userId);
  }

  static async updateBlockchainNodesByBlockchain() {
    return await BlockchainCacheService.updateBlockchainNodesByBlockchain();
  }
}

module.exports = BlockchainService;