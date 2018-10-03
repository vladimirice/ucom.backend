const config = require('config');
const eosConfig = config.get('eosConfig');
const models = require('../../models');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);

class EosImportance {
  static async getImportanceTableRows() {
    // noinspection JSUnresolvedFunction
    const data = await eos.getTableRows({
      json: true,
      code: 'uos.activity',
      scope: 'uos.activity',
      table: 'rate',
      limit: 9999999999,
    });

    return data.rows;
  }

  static async updateRatesByBlockchain() {
    const importanceData = await EosImportance.getImportanceTableRows();

    let promises = [];
    importanceData.forEach(async function(data) {
      let tableName;
      let field;

      if (data['acc_name'].startsWith("pst")) {
        tableName = 'posts';
        field = 'blockchain_id';
      } else if (data['acc_name'].startsWith("org-")) {
        tableName = 'organizations';
        field = 'blockchain_id';
      } else {
        tableName = 'Users';
        field = 'account_name';
      }

      if (!data["acc_name"].startsWith('pstms15-')) {
        const sql = `UPDATE "${tableName}" SET current_rate = ${data['value']} WHERE ${field} = '${data["acc_name"]}'`;
        console.log(sql);
        promises.push(models.sequelize.query(sql));
      }
    });

    return await Promise.all(promises);
  }

  static getImportanceMultiplier () {
    return 10000;
  }
}

module.exports = EosImportance;