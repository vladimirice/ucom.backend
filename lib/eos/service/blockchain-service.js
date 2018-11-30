const BlockchainCacheService    = require('./blockchain-cache-service');
const BlockchainApiFetchService = require('./blockchain-api-fetch-service');
const BlockchainTrTracesService = require('./blockchain-tr-traces-service');

const TR_TYPE__TRANSFER_FROM  = 10;
const TR_TYPE__TRANSFER_TO    = 11;
const TR_TYPE_STAKE_RESOURCES = 20;

const TR_TYPE_UNSTAKING_REQUEST = 30;
const TR_TYPE_VOTE_FOR_BP       = 40;

const TR_TYPE_CLAIM_EMISSION    = 50; // step 2
const TR_TYPE_BUY_RAM           = 60;
const TR_TYPE_SELL_RAM          = 61;

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
      const data = [
      {
        tr_type: TR_TYPE_BUY_RAM,
        updated_at: '2018-11-28 15:03:12Z',
        resources: {
          ram: {
            dimension: 'kB',
            amount:  0.26,
            tokens: {
              amount: 2,
              currency: CURRENCY__UOS,
            },
          },
        },
      },
      {
        tr_type: TR_TYPE_SELL_RAM,
        updated_at: '2018-11-28 07:20:33Z',
        resources: {
          ram: {
            dimension: 'kB',
            amount:  1.456,
            tokens: {
              amount: 20.032,
              currency: CURRENCY__UOS,
            },
          },
        },
      },
      {
        tr_type: TR_TYPE_UNSTAKING_REQUEST,
        updated_at: '2018-11-27 12:00:00Z',
        resources: {
          cpu: {
            unstaking_request: {
              amount: 10,
              currency: CURRENCY__UOS,
            },
          },
          net: {
            unstaking_request: {
              amount: 0,
              currency: CURRENCY__UOS,
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