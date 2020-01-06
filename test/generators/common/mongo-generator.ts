import IrreversibleTracesClient = require('../../../lib/blockchain-traces/client/irreversible-traces-client');
import MongoExternalModelProvider = require('../../../lib/eos/service/mongo-external-model-provider');

class MongoGenerator {
  public static async truncateAll(): Promise<void> {
    const manyCollections = [
      MongoExternalModelProvider.actionTracesCollection(),
    ];

    const db = await IrreversibleTracesClient.getDbConnection();
    for (const collection of manyCollections) {
      await db.dropCollection(collection);
    }
  }
}

export = MongoGenerator;
