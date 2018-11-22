const db = require('../../../models').sequelize;

class EntityEventParamGenerator {
  /**
   *
   * @param {Object[]} dataSet
   * @return {Promise<void>}
   */
  static async createBasicSample(dataSet) {
    const toInsert = [];

    dataSet.forEach(data => {
      let before  = `('${data.blockchain_id}'`;
      const importanceBefore = {importance: data.importance.before};

      let after   = `('${data.blockchain_id}'`;
      const importanceAfter = {importance: data.importance.after};

      before += `, '${data.entity_name}'`;
      before += `, '${JSON.stringify(importanceBefore)}'`;
      before += `, ${data.event_type}`;
      before += `, '${data.created_at.before}')`;

      after += `, '${data.entity_name}'`;
      after += `, '${JSON.stringify(importanceAfter)}'`;
      after += `, ${data.event_type}`;
      after += `, '${data.created_at.after}')`;

      toInsert.push(before);
      toInsert.push(after);
    });

    const sql = `
      INSERT INTO entity_event_param (entity_blockchain_id, entity_name, json_value, event_type, created_at) 
      VALUES ${toInsert.join(', ')}
    `;

    return db.query(sql);
  }
}

module.exports = EntityEventParamGenerator;