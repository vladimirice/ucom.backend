"use strict";
const { MongoClient } = require('mongodb');
const mongoConfig = require('config').mongo.irreversible_traces;
let client;
const MONGO_CONNECTION_TIMEOUT = (30 * 1000); // 30 seconds
class IrreversibleTracesClient {
    static async useCollection(name) {
        const db = await this.getDbConnection();
        return db.collection(name);
    }
    static async getDbConnection() {
        if (!client) {
            client = new MongoClient(mongoConfig.connection_string, {
                useNewUrlParser: true,
                connectTimeoutMS: MONGO_CONNECTION_TIMEOUT,
                socketTimeoutMS: MONGO_CONNECTION_TIMEOUT,
                useUnifiedTopology: true,
            });
            await client.connect();
        }
        return client.db(mongoConfig.db_name);
    }
}
module.exports = IrreversibleTracesClient;
