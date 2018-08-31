const config = require('config');
const EosTransactionService = require('./eos-transaction-service');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';
const CREATE_CONTENT_ACTION = 'makecontent';
const ACTION__CONTENT_INTERACTION = 'usertocont';
const ACTION__USER_TO_USER = 'usertouser';

class EosUsersActivity {
  static async sendUserPostActivity(senderData, postBlockchainId, interactionTypeId) {

    const transactionData = {
      action_name: ACTION__CONTENT_INTERACTION,
      interaction_type: interactionTypeId,
    };

    EosTransactionService.createAndSendTransaction(senderData, postBlockchainId, transactionData)
  }

  static async sendUserUserActivity(senderData, account_name_to, interactionTypeId) {

    const transactionData = {
      action_name: ACTION__USER_TO_USER,

      data: {
        acc_from: senderData.account_name,
        acc_to: account_name_to,
        interaction_type_id: interactionTypeId,
      }
    };

    EosTransactionService.createAndSendUserToUser(senderData, transactionData)
  }
}

module.exports = EosUsersActivity;
