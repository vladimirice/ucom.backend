const config = require('config');
const eosConfig = config.get('eosConfig');

const Eos = require('eosjs');
const eos = Eos(eosConfig);
const Brainkey = require('../crypto/brainkey');
const EosBlockchainStatusDictionary = require('./eos-blockchain-status-dictionary');
const { TransactionFactory, TransactionSender } = require('uos-app-transaction');

// noinspection JSUnusedLocalSymbols
const BYTES_LENGTH = 16;
const BRAINKEY_LENGTH = 12;

class EosApi {

  /**
   *
   * @param {Object} model
   * @param {Object|null} transaction
   */
  static async processNotRequiredToSendToBlockchain(model, transaction = null) {
    await model.update({blockchain_status: EosBlockchainStatusDictionary.getNotRequiredToSend()}, { transaction });
  }

  /**
   *
   * @param {Object} model
   * @param {Object|null} transaction
   */
  static async processIsSendToBlockchain(model, transaction = null) {
    await model.update({blockchain_status: EosBlockchainStatusDictionary.getStatusIsSent()}, { transaction });
  }

  static initTransactionFactory() {
    if (process.env.NODE_ENV === 'production') {
      TransactionFactory.initForProductionEnv();
      TransactionSender.initForProductionEnv();
    } else {
      TransactionFactory.initForStagingEnv();
      TransactionSender.initForStagingEnv()
    }
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

  static getAbi(accountName) {

    // console.dir(eosConfig);

    eos.getAbi(accountName).then((res) => {

      console.dir(res);

      // const structs = res.abi.structs;
      //
      // const utc = structs.find(data => data.name === 'usertocont');
      //
      // console.log(utc);
      //

      // console.log('Success: ', res.abi.structs);
    }).catch((err) => {
      console.log('Error of get abi: ', err);
    })
  }


  static async getAccountInfo(accountName) {

    // console.dir(eosConfig);
    // return;

    return await eos.getAccount(accountName);
  }

  // noinspection JSUnusedGlobalSymbols
  static generateBrainkey() {
    return Brainkey.generateSimple(BRAINKEY_LENGTH);
  }

  // noinspection FunctionWithInconsistentReturnsJS
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