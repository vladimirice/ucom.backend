const config = require('config');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';
const CREATE_CONTENT_ACTION = 'makecontent';
const INTERACTION_TYPE_UPVOTE = 2;

const transactionData = {
  smart_contract: SMART_CONTRACT,
  action_name: 'usertocont'
};

class EosTransactionService {
  static createAndSendTransaction(senderData, contentId) {
    const eos = EosJs({
      keyProvider: [
        senderData.activePk,
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    eos.transaction({
      actions: [{
        account: transactionData.smart_contract,
        name: transactionData.action_name,
        authorization: [{
          actor: senderData.account_name,
          permission: 'active',
        }],
        data: {
          acc: senderData.account_name,
          content_id: contentId,
          interaction_type_id: INTERACTION_TYPE_UPVOTE,
        },
      }],
    }).then((res) => {
      console.log(res);
    });
  }
}

module.exports = EosTransactionService;