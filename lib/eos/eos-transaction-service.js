const config = require('config');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';


class EosTransactionService {
  static createAndSendTransaction(senderData, contentBlockchainId, transactionData) {
    const eos = EosJs({
      keyProvider: [
        senderData.activePk,
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    eos.transaction({
      actions: [{
        account: SMART_CONTRACT,
        name: transactionData.action_name,
        authorization: [{
          actor: senderData.account_name,
          permission: 'active',
        }],
        data: {
          acc: senderData.account_name,
          content_id: contentBlockchainId,
          interaction_type_id: transactionData.interaction_type,
        },
      }],
    }).then((res) => {
      console.log(res);
    });
  }
}

module.exports = EosTransactionService;