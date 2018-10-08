const UserActivitySerializer = require('../../users/job/user-activity-serializer');
const UserRepository = require('../../users/repository');
const { TransactionSender } = require('uos-app-transaction');

class BlockchainJobProcessor {
  static async process(message) {
    if (!message.id) {
      throw new Error(`Malformed message. ID is required. Message is: ${JSON.stringify(message)}`);
    }

    if (!message.scope) {
      throw new Error(`Malformed message. Scope is required. Message is: ${JSON.stringify(message)}`);
    }

    const signedTransaction = await UserActivitySerializer.getActivityDataToPushToBlockchain(message);
    const blockchainResponse = await TransactionSender.pushTransaction(signedTransaction.transaction);

    if (message.scope === 'users_activity') {
      await UserRepository.Activity.setIsSentToBlockchainAndResponse(
        message.id,
        JSON.stringify(blockchainResponse)
      );
    } else {
      throw new Error(`Unsupported scope: ${message.scope}`);
    }
  }
}

module.exports = BlockchainJobProcessor;