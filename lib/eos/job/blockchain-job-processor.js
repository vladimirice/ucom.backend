const UserActivitySerializer = require('../../users/job/user-activity-serializer');
const UserRepository = require('../../users/repository');
const { TransactionSender } = require('uos-app-transaction');
const UsersActivityRepository = require('../../users/repository').Activity;
const { InteractionTypeDictionary } = require('uos-app-transaction');

const activityIdsToSkip = [
  InteractionTypeDictionary.getOrgTeamInvitation(),
];

class BlockchainJobProcessor {
  static async process(message) {
    if (!message.id) {
      throw new Error(`Malformed message. ID is required. Message is: ${JSON.stringify(message)}`);
    }

    const activity = await UsersActivityRepository.findOnlyItselfById(+message.id);
    if (!activity) {
      throw new Error(`There is no activity with the ID ${message.id}`);
    }

    if (activityIdsToSkip.indexOf(activity.activity_type_id) !== -1) {
      console.log(`Blockchain consumer skips and ack activity with ID ${activity.id} and activity_type_id ${activity.activity_type_id}`);

      return;
    }

    const signedTransaction = await UserActivitySerializer.getActivityDataToPushToBlockchain(message);
    const blockchainResponse = await TransactionSender.pushTransaction(signedTransaction.transaction);

    await UserRepository.Activity.setIsSentToBlockchainAndResponse(
      message.id,
      JSON.stringify(blockchainResponse)
    );
  }
}

module.exports = BlockchainJobProcessor;