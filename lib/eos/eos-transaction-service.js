const config = require('config');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';

const { TransactionFactory } = require('uos-app-transaction');

class EosTransactionService {

  /**
   *
   * @param {Object} user
   * @param {Object} body
   * @param {string} contentBlockchainId
   * @param {number} activityTypeId
   * @return {Promise<void>}
   */
  static async appendSignedUserVotesContent(user, body, contentBlockchainId, activityTypeId) {
    if (body.signed_transaction) {
      return;
    }

    body.signed_transaction = await TransactionFactory.getSignedUserToContentActivity(
      user.account_name,
      user.private_key,
      contentBlockchainId,
      activityTypeId
    );
  }

  /**
   * @deprecated
   * @see uos-app-transactions
   * @param {Object} senderData
   * @param {string} contentBlockchainId
   * @param {Object} transactionData
   */
  static createAndSendTransaction(senderData, contentBlockchainId, transactionData) {
    const eos = EosJs({
      keyProvider: [
        senderData.activePk,
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    // noinspection JSUnresolvedFunction
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