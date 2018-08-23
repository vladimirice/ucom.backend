const config = require('config');
const eosConfig = config.get('eosConfig');

const Eos = require('eosjs');
const eos = Eos(eosConfig);
const Brainkey = require('../crypto/brainkey');

const BYTES_LENGTH = 16;
const BRAINKEY_LENGTH = 12;

class EosApi {

  static async doesAccountExist(accountName) {
    const result = await this.isAccountAvailable(accountName);

    return !result;
  }

  static generateBrainkey() {
    return Brainkey.generateSimple(BRAINKEY_LENGTH);
  }

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