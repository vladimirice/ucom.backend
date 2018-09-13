const config = require('config');
const EosTransactionService = require('./eos-transaction-service');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';
const CREATE_CONTENT_ACTION = 'makecontent';
const ACTION__CONTENT_INTERACTION = 'usertocont';
const ACTION__USER_TO_USER = 'usertouser';

class EosUsersActivity {

  /**
   *
   * @param {Object} userFrom
   * @param {number} contentBlockchainId
   * @param {number} interactionTypeId
   * @returns {Promise<void>}
   */
  static async sendUserContentActivity(userFrom, contentBlockchainId, interactionTypeId) {
    const senderData = this._getSenderDataFromUser(userFrom);

    const transactionData = {
      action_name: ACTION__CONTENT_INTERACTION,
      interaction_type: interactionTypeId,
    };

    EosTransactionService.createAndSendTransaction(senderData, contentBlockchainId, transactionData)
  }

  /**
   * @deprecated
   * @see sendUserContentActivity
   * @param senderData
   * @param postBlockchainId
   * @param interactionTypeId
   * @returns {Promise<void>}
   */
  static async sendUserPostActivity(senderData, postBlockchainId, interactionTypeId) {

    const transactionData = {
      action_name: ACTION__CONTENT_INTERACTION,
      interaction_type: interactionTypeId,
    };

    EosTransactionService.createAndSendTransaction(senderData, postBlockchainId, transactionData)
  }

  static async sendUserUserActivity(userFrom, account_name_to, interactionTypeId) {
    const senderData = this._getSenderDataFromUser(userFrom);

    const transactionData = {
      action_name: ACTION__USER_TO_USER,

      data: {
        acc_from: senderData.account_name,
        acc_to: account_name_to,
        interaction_type_id: interactionTypeId,
      }
    };

    await EosTransactionService.createAndSendUserToUser(senderData, transactionData);
  }

  /**
   *
   * @param {Object} user
   * @returns {Object}
   * @private
   */
  static _getSenderDataFromUser(user) {
    return {
      'account_name': user.account_name,
      'activePk': user.private_key
    };
  }
}

module.exports = EosUsersActivity;
