const config = require('config');
const eosConfig = config.get('eosConfig');

const Eos = require('eosjs');
const eos = Eos(eosConfig);
const Brainkey = require('../crypto/brainkey');
const EosBlockchainStatusDictionary = require('./eos-blockchain-status-dictionary');

// noinspection JSUnusedLocalSymbols
const BYTES_LENGTH = 16;
const BRAINKEY_LENGTH = 12;

class EosApi {

  /**
   *
   * @param {Object} model
   */
  static async processNotRequiredToSendToBlockchain(model) {
    await model.update({blockchain_status: EosBlockchainStatusDictionary.getNotRequiredToSend()});
  }

  /**
   *
   * @param {Object} model
   */
  static async processIsSendToBlockchain(model) {
    await model.update({blockchain_status: EosBlockchainStatusDictionary.getStatusIsSent()});
    console.log('Blockchain is not executed in env: ', process.env.NODE_ENV);
  }

  /**
   * @returns {boolean}
   */
  static mustSendToBlockchain() {
    return process.env.NODE_ENV === 'production';
  }

  static async doesAccountExist(accountName) {
    const result = await this.isAccountAvailable(accountName);

    return !result;
  }

  // noinspection JSUnusedGlobalSymbols
  static generateBrainkey() {
    return Brainkey.generateSimple(BRAINKEY_LENGTH);
  }

  static async isAccountAvailable(accountName) {
    try {
      // noinspection JSUnresolvedFunction
      const account = await eos.getAccount(accountName);
      if (account) {
        return false;
      }
    } catch (error) {
      try {
        const data = JSON.parse(error.message);
        // noinspection JSUnresolvedVariable
        return data.error.what === 'unspecified';
      } catch(e) {
        return false;
      }
    }
  }
}

module.exports = EosApi;