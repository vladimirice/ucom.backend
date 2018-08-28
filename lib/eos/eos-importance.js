const config = require('config');
const eosConfig = config.get('eosConfig');
const models = require('../../models');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);

class EosImportance {
  static async getImportanceTableRows() {
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
      let sql = '';

      if (data['acc_name'].startsWith("pst")) {
        sql = `UPDATE "posts" SET current_rate = ${data['value']} WHERE blockchain_id = '${data["acc_name"]}'`;
      } else {
        sql = `UPDATE "Users" SET current_rate = ${data['value']} WHERE account_name = '${data["acc_name"]}'`;
      }

      console.log(sql);
      promises.push(models.sequelize.query(sql));
    });

    return await Promise.all(promises);
  }

  static getImportanceMultiplier () {
    return 10000;
  }
}

module.exports = EosImportance;