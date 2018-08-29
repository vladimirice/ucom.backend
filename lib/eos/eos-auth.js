const config = require('config');
const eosConfig = config.get('eosConfig');

const EosPlayground = require('eosjs');
const eos = EosPlayground(eosConfig);

class EosAuth {
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

  static async doesAccountExist(accountName) {
    const result = await EosAuth.isAccountAvailable(accountName);

    return !result;
  }
}


module.exports = EosAuth;