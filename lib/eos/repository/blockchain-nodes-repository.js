const BlockchainModelProvider = require('../service/blockchain-model-provider');

const model = BlockchainModelProvider.getModel();
const TABLE_NAME = BlockchainModelProvider.getTableName();

const db = require('../../../models').sequelize;

class BlockchainNodesRepository {

  /**
   *
   * @param {string[]} existedTitles
   * @return {Promise<*>}
   */
  static async setDeletedAtNotExisted(existedTitles) {
    const prepared = existedTitles.map(item => {
      return `'${item}'`
    });

    const sql = `
      UPDATE ${TABLE_NAME} 
      SET deleted_at = NOW() 
      WHERE
        title NOT IN (${prepared.join(', ')})
    `;

    return db.query(sql);
  }

  /**
   *
   * @param {Object} data
   * @param {Object|null} transaction
   * @return {Promise<Object>}
   */
  static async createOrUpdateNodes(data, transaction = null) {
    const keys = Object.keys(data[0]).join(', ');

    const values = [];
    for (let i = 0; i < data.length; i++) {

      const m = [];
      Object.values(data[i]).forEach(item => {
        if (typeof item === 'string') {
          m.push(`'${item}'`);
        } else {
          m.push(item);
        }
      });

      values.push(`(${m.join(', ')})`);
    }

    let valuesString = values.join(', ');
    valuesString = valuesString.substring(1);
    valuesString = valuesString.slice(0, -1);

    const sql = `
    INSERT INTO ${TABLE_NAME} 
      (${keys})
    VALUES (${valuesString})
    ON CONFLICT (title) DO
    UPDATE
        SET votes_count   = EXCLUDED.votes_count,
            votes_amount  = EXCLUDED.votes_amount,
            currency      = EXCLUDED.currency,
            bp_status     = EXCLUDED.bp_status
    `;

    return db.query(sql);
  }

  /**
   *
   * @param {boolean} raw
   * @return {Promise<Object>}
   */
  static async findAllBlockchainNodes(raw) {
    const data = await model.findAll({
      attributes: BlockchainModelProvider.getFieldsForPreview(),
      raw,
    });

    data.forEach(item => {
      item.votes_amount = +item.votes_amount;
    });

    return data;
  }
}

module.exports = BlockchainNodesRepository;