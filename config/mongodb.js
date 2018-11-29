const MongoClient = require('mongodb').MongoClient;
const eosConfig = require('config').eos;

const connectionString = eosConfig.mongo_connection_string;
const dbName = eosConfig.mongo_db_name;

let client;

class BlockchainMongoDbClient {
  /**
   *
   * @returns {Promise<Db>}
   */
  static async getDbConnection() {
    if (!client) {
      client = new MongoClient(connectionString, { useNewUrlParser: true });
      await client.connect();
    }

    return client.db(dbName);
  }
}

module.exports = {
  BlockchainMongoDbClient,
};
