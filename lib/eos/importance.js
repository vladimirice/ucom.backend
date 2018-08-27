const config = require('config');
const eosConfig = config.get('eosConfig');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);

class Importance {
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
}

module.exports = Importance;