const BlockchainMongoDbClient = require('../service/blockchain-mongodb-client');

const COLLECTION_NAME = 'transaction_traces';

const _ = require('lodash');

// TODO - move to wallet dictionary
const TR_TYPE_TRANSFER        = 12;

const TR_TYPE_STAKE_RESOURCES = 20;

const TR_TYPE_UNSTAKING_REQUEST = 30;
const TR_TYPE_VOTE_FOR_BP       = 40;

const TR_TYPE_CLAIM_EMISSION    = 50; // step 2
const TR_TYPE_BUY_RAM           = 60; // step 2
const TR_TYPE_SELL_RAM          = 61; // step 2

const accountNamesToSkip = [
  'uos.holder',
  'accregistrar',

  'eosio',
  'eosio.bpay',
  'eosio.msig',
  'eosio.names',
  'eosio.null',
  'eosio.prods',
  'eosio.ram',
  'eosio.ramfee',
  'eosio.saving',
  'eosio.stake',
  'eosio.token',
  'eosio.vpay',
];

const trTypeToWhere = {
  [TR_TYPE_TRANSFER]: {
    $and: [
      {"action_traces.act.account": "eosio.token"},
      {"action_traces.act.name": "transfer"},
      {"action_traces.act.data.from": {$nin: accountNamesToSkip}},
      {"action_traces.act.data.to":   {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 1"},
    ]
  },
  [TR_TYPE_STAKE_RESOURCES]: {
    $and: [
      {"action_traces.act.account":   "eosio" },
      {"action_traces.act.name":      "delegatebw" },
      {"action_traces.act.name":      {$ne: "undelegatebw"} },
      {"action_traces.act.data.from": {$nin: accountNamesToSkip}},
      {"action_traces.act.data.to":   {$nin: accountNamesToSkip}},
    ]
  },
  [TR_TYPE_UNSTAKING_REQUEST]: {
    $and: [
      {"action_traces.act.account":   "eosio" },
      {"action_traces.act.name":      "undelegatebw" },
      {"action_traces.act.name":      {$ne: "delegatebw"} },
      {"action_traces.act.data.from": {$nin: accountNamesToSkip}},
      {"action_traces.act.data.to":   {$nin: accountNamesToSkip}},
    ]
  },
  [TR_TYPE_VOTE_FOR_BP]: {
    $and: [
      {"action_traces.act.account":   "eosio" },
      {"action_traces.act.name":      "voteproducer" },
      {"action_traces.act.data.voter": {$nin: accountNamesToSkip}},
    ]
  },
  [TR_TYPE_BUY_RAM]: {
    $and: [
      {"action_traces.act.account": "eosio"},
      {"action_traces.act.name": "buyrambytes"},
      {"action_traces.act.data.payer": {$nin: accountNamesToSkip}},
      {"action_traces.act.data.receiver": {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 1"}
    ],
  },
  [TR_TYPE_SELL_RAM]: {
    $and: [
      {"action_traces.act.account": "eosio"},
      {"action_traces.act.name": "sellram"},
      {"action_traces.act.data.account": {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 1"}
    ]
  }
};

class MongodbTrTracesRepository {
  /**
   *
   * @param {number} trType
   * @param {number} limit
   * @param {string|null} idGreaterThan
   * @returns {Promise<*>}
   */
  static async findTransferTransactions(trType, limit, idGreaterThan = null) {
    const collection = await BlockchainMongoDbClient.useCollection(COLLECTION_NAME);

    // where will be changed. In order to have different state for different requests
    // const where = _.cloneDeep(whereTransferTransactions);

    if (!trTypeToWhere[trType]) {
      throw new Error(`There is no where set for mongo for tr_type: ${trType}`);
    }

    const where = _.cloneDeep(trTypeToWhere[trType]);

    if (idGreaterThan) {
      where['$and'].push({_id: {'$gt' : idGreaterThan}});
    }

    return await collection.find(where).sort({_id: 1}).limit(limit).toArray();
  }
}

module.exports = MongodbTrTracesRepository;