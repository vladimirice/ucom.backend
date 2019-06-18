"use strict";
const MongoExternalModelProvider = require("../../eos/service/mongo-external-model-provider");
const IrreversibleTracesClient = require("../client/irreversible-traces-client");
const ACTION_TRACES = MongoExternalModelProvider.actionTracesCollection();
class BlockchainTracesSyncService {
    static async process() {
        const limit = 5;
        const blockNumberGreaterThan = null;
        await this.processOneBatch(limit, blockNumberGreaterThan);
        /*
        ask for last block or blocks (id > last memorized id) - 0.5
        foreach every block - 0.5
        chain of responsibility - check conditions for every transaction processing block - 1h
        ** If match then process it - call related processor => Save processed data to postgres (same structure but new table) - 0.5h
        Autotests, patterns implementations - 1.5h
     */
    }
    static async processOneBatch(limit, blockNumberGreaterThan = null) {
        const collection = await IrreversibleTracesClient.useCollection(ACTION_TRACES);
        const where = {
            $and: [
                { irreversible: true },
            ],
        };
        if (typeof blockNumberGreaterThan === 'number') {
            where.$and.push({
                blocknum: {
                    $gt: blockNumberGreaterThan,
                },
            });
        }
        const manyDocs = await collection
            .find(where)
            .sort({ blocknum: -1 })
            .limit(limit)
            .toArray();
        for (const doc of manyDocs) {
            console.dir(doc);
        }
    }
}
module.exports = BlockchainTracesSyncService;
