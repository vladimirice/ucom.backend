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
}

module.exports = EosTransactionService;