const { MongoClient } = require('mongodb');
const mongoConfig = require('config').mongo.irreversible_traces;

let client;
const MONGO_CONNECTION_TIMEOUT = (30 * 1000); // 30 seconds

class IrreversibleTracesClient {
  public static async useCollection(name: string) {
    const db = await this.getDbConnection();

    return db.collection(name);
  }

  public static async getDbConnection(): Promise<any> {
    if (!client) {
      client = new MongoClient(mongoConfig.connection_string, {
        useNewUrlParser: true,
        connectTimeoutMS: MONGO_CONNECTION_TIMEOUT,
        socketTimeoutMS:  MONGO_CONNECTION_TIMEOUT,
      });
      await client.connect();
    }

    return client.db(mongoConfig.db_name);
  }
}

export = IrreversibleTracesClient;
