"use strict";
const BlockchainModelProvider = require("../../eos/service/blockchain-model-provider");
const knex = require("../../../config/knex");
const TABLE_NAME = BlockchainModelProvider.irreversibleTracesTableName();
class IrreversibleTracesRepository {
    static async insertManyTraces(traces) {
        const sql = knex(TABLE_NAME).insert(traces).toSQL();
        // eslint-disable-next-line no-return-assign
        const data = await knex.raw(sql.sql += ' ON CONFLICT DO NOTHING RETURNING tr_id;', sql.bindings);
        return data.rows.map(item => item.tr_id);
    }
}
module.exports = IrreversibleTracesRepository;
