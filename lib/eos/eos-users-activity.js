const EosTransactionService = require('./eos-transaction-service');
const ACTION__CONTENT_INTERACTION = 'usertocont';

class EosUsersActivity {

  /**
   *
   * @param {Object} userFrom
   * @param {string} contentBlockchainId
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
   * @param {Object} senderData
   * @param {string} postBlockchainId
   * @param {number} interactionTypeId
   * @returns {Promise<void>}
   */
  static async sendUserPostActivity(senderData, postBlockchainId, interactionTypeId) {

    const transactionData = {
      action_name: ACTION__CONTENT_INTERACTION,
      interaction_type: interactionTypeId,
    };

    EosTransactionService.createAndSendTransaction(senderData, postBlockchainId, transactionData)
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
