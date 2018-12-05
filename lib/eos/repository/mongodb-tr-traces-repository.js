const BlockchainMongoDbClient = require('../service/blockchain-mongodb-client');
const {ObjectId} = require('mongodb');

const COLLECTION_NAME = 'transaction_traces';

const _ = require('lodash');

const BlockchainTrTracesDictionary = require('uos-app-wallet').Dictionary.BlockchainTrTraces;

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
  [BlockchainTrTracesDictionary.getTypeTransfer()]: {
    $and: [
      {"action_traces.act.account": "eosio.token"},
      {"action_traces.act.name": "transfer"},
      {"action_traces.act.data.from": {$nin: accountNamesToSkip}},
      {"action_traces.act.data.to":   {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 1"},
    ]
  },
  [BlockchainTrTracesDictionary.getTypeStakeResources()]: {
    $and: [
      {"action_traces.act.account":       "eosio" },
      {"action_traces.act.name":          "delegatebw" },
      {"action_traces.act.name":          {$ne: "undelegatebw"} },
      {"action_traces.act.data.from":     {$nin: accountNamesToSkip}},
      {"action_traces.act.data.receiver": {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length < 3"},
    ]
  },
  [BlockchainTrTracesDictionary.getTypeUnstakingRequest()]: {
    $and: [
      {"action_traces.act.account":       "eosio" },
      {"action_traces.act.name":          "undelegatebw" },
      {"action_traces.act.name":          {$ne: "delegatebw"} },
      {"action_traces.act.data.from":     {$nin: accountNamesToSkip}},
      {"action_traces.act.data.receiver": {$nin: accountNamesToSkip}},
    ]
  },
  [BlockchainTrTracesDictionary.getTypeVoteForBp()]: {
    $and: [
      {"action_traces.act.account":   "eosio" },
      {"action_traces.act.name":      "voteproducer" },
      {"action_traces.act.data.voter": {$nin: accountNamesToSkip}},
    ]
  },
  [BlockchainTrTracesDictionary.getTypeBuyRamBytes()]: {
    $and: [
      {"action_traces.act.account": "eosio"},
      {"action_traces.act.name": "buyrambytes"},
      {"action_traces.act.data.payer": {$nin: accountNamesToSkip}},
      {"action_traces.act.data.receiver": {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 1"}
    ],
  },
  [BlockchainTrTracesDictionary.getTypeSellRam()]: {
    $and: [
      {"action_traces.act.account": "eosio"},
      {"action_traces.act.name": "sellram"},
      {"action_traces.act.data.account": {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 1"}
    ]
  },
  [BlockchainTrTracesDictionary.getTypeClaimEmission()]: {
    $and: [
      {"action_traces.act.account": "uos.calcs"},
      {"action_traces.act.name": "withdrawal"},
      {"action_traces.act.data.account": {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 1"}
    ]
  },
  [BlockchainTrTracesDictionary.getTypeStakeWithUnstake()]: {
    $and: [
      {"action_traces.act.account":       "eosio" },
      {"action_traces.act.name":          {$in: ["delegatebw", "undelegatebw"] } },
      {"action_traces.act.data.from":     {$nin: accountNamesToSkip}},
      {"action_traces.act.data.receiver": {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 2"}
    ]
  },
  [BlockchainTrTracesDictionary.getTypeMyselfRegistration()]: {
    $and: [
      {"action_traces.act.account":       "eosio" },
      {"action_traces.act.name":          'newaccount' },
      {"action_traces.act.data.from":     {$nin: accountNamesToSkip}},
      {"action_traces.act.data.receiver": {$nin: accountNamesToSkip}},
      {$where: "this.action_traces.length = 3"}
    ]
  },
};

class MongodbTrTracesRepository {
  /**
   *
   * @param {number} trType
   * @param {number} limit
   * @param {string|null} idGreaterThan
   * @param {string|null} idLessThan
   * @returns {Promise<*>}
   */
  static async findTransferTransactions(trType, limit, idGreaterThan = null, idLessThan = null) {
    const collection = await BlockchainMongoDbClient.useCollection(COLLECTION_NAME);

    // where will be changed. In order to have different state for different requests
    // const where = _.cloneDeep(whereTransferTransactions);

    if (!trTypeToWhere[trType]) {
      throw new Error(`There is no where set for mongo for tr_type: ${trType}`);
    }

    const where = _.cloneDeep(trTypeToWhere[trType]);

    if (idGreaterThan) {
      where['$and'].push({_id: {$gt : idGreaterThan}});
    }

    if (idLessThan) {
      where['$and'].push({_id: {$lt : ObjectId(idLessThan)}});
    }

    return await collection.find(where).sort({_id: 1}).limit(limit).toArray();
  }
}

module.exports = MongodbTrTracesRepository;