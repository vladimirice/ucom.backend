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

  /**
   *
   * @param {string} name
   * @returns {Promise<Collection>}
   */
  static async useCollection(name) {
    const db = await this.getDbConnection();

    return db.collection(name);
  }
}

module.exports = BlockchainMongoDbClient;
