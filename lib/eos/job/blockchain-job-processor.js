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

    await UserRepository.ActivityUserUser.setIsSentToBlockchainAndResponse(
      message.id,
      JSON.stringify(blockchainResponse)
    );
  }
}

module.exports = BlockchainJobProcessor;