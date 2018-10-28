const EosTransactionService = require('./eos-transaction-service');
const ACTION__CONTENT_INTERACTION = 'usertocont';

class EosUsersActivity {

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
}

module.exports = EosUsersActivity;
