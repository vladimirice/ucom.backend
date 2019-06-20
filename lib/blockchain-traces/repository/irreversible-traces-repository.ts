import BlockchainModelProvider = require('../../eos/service/blockchain-model-provider');
import knex = require('../../../config/knex');
const TABLE_NAME = BlockchainModelProvider.irreversibleTracesTableName();

class IrreversibleTracesRepository {
  public static async insertManyTraces(traces): Promise<string[]> {
    const sql = knex(TABLE_NAME).insert(traces).toSQL();

    // eslint-disable-next-line no-return-assign
    const data = await knex.raw(sql.sql += ' ON CONFLICT DO NOTHING RETURNING tr_id;', sql.bindings);

    return data.rows.map(item => item.tr_id);
  }
}

export = IrreversibleTracesRepository;
