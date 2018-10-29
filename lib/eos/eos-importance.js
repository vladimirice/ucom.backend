const models = require('../../models');
const { TransactionSender } = require('uos-app-transaction');

class EosImportance {
  static async updateRatesByBlockchain() {
    const importanceData = await TransactionSender.getImportanceTableRows();

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