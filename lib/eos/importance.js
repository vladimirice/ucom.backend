const config = require('config');
const eosConfig = config.get('eosConfig');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);

class Importance {
  static async getTableRows() {
    const result = eos.getTableRows({
      json: true,
      code: 'user',
      scope: 'user',
      table: 'rate',
      limit: 9999999999,
    });
  }

}

module.exports = Importance;