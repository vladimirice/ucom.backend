const BlockchainMongoDbClient = require('../service/blockchain-mongodb-client');

const COLLECTION_NAME = 'transaction_traces';
const BATCH_SIZE = 100;

const _ = require('lodash');

const whereTransferTransactions = {
  $and: [
    { "action_traces.act.account": "eosio.token" },
    { "action_traces.act.name": "transfer" },
    {"action_traces.act.data.from": {$nin: ['eosio', 'uos.holder', 'accregistrar']}},
    {"action_traces.act.data.to": {$nin: ['eosio', 'uos.holder', 'accregistrar']}},
    { $where: "this.action_traces.length = 1" },
  ]
};

class MongodbTrTracesRepository {

  static async getTransferTransactions() {
    const collection = await BlockchainMongoDbClient.useCollection(COLLECTION_NAME);

    // where will be changed. In order to have different state for different requests
    const where = _.cloneDeep(whereTransferTransactions);

    let docs, lastId;
    let totalAmount = 0;

    const count = await collection.find(where).count();

    let docsCache = [];
    do {
      docs = await collection.find(where).sort({_id: 1}).limit(BATCH_SIZE).toArray();

      if (docs.length === 0) {
        break;
      }

      if (lastId) {
        lastId = docs[docs.length - 1]._id;
        where['$and'][where['$and'].length -1]._id['$gt'] = lastId;
      } else {
        lastId = docs[docs.length - 1]._id;
        where['$and'].push({_id: {'$gt' : lastId}});
      }

      docsCache = docsCache.concat(docs);
      totalAmount += docs.length;
    } while(docs.length > 0);
  }
}

module.exports = MongodbTrTracesRepository;