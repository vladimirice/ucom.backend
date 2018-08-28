const config = require('config');
const EosTransactionService = require('./eos-transaction-service');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';
const CREATE_CONTENT_ACTION = 'makecontent';
const ACTION__CONTENT_INTERACTION = 'usertocont';

class EosUsersActivity {
  static async sendContentUpvoting(senderData, postBlockchainId, interactionTypeId) {

    const transactionData = {
      action_name: ACTION__CONTENT_INTERACTION,
      interaction_type: interactionTypeId,
    };

    EosTransactionService.createAndSendTransaction(senderData, postBlockchainId, transactionData)
  }
}

module.exports = EosUsersActivity;
