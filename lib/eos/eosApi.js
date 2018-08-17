const config = require('config');
const eosConfig = config.get('eosConfig');

const Eos = require('eosjs');
const eos = Eos(eosConfig);

class EosApi {
  static async isAccountAvailable(accountName) {
    try {
      const account = await eos.getAccount(accountName);
      if (account) {
        return false;
      }
    } catch (error) {
      try {
        const data = JSON.parse(error.message);
        return data.error.what === 'unspecified';
      } catch(e) {
        return false;
      }
    }
  }
}

module.exports = EosApi;