const UserActivitySerializer = require('../../users/job/user-activity-serializer');
const UserRepository = require('../../users/repository');
const { TransactionSender } = require('uos-app-transaction');
const UsersActivityRepository = require('../../users/repository').Activity;
const { InteractionTypeDictionary } = require('uos-app-transaction');
const EventIdDictionary = require('../../entities/dictionary').EventId;


const activityIdsToSkip = [
  InteractionTypeDictionary.getOrgTeamInvitation(),
];

const eventIdsToSkip = [
  EventIdDictionary.getUserCreatesDirectPostForOrg(),
  EventIdDictionary.getUserCreatesDirectPostForOtherUser(),
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

    if (~eventIdsToSkip.indexOf(activity.event_id)) {
      console.log(`Blockchain consumer skips and ack activity with ID ${activity.id} and event_id ${activity.event_id}`);

      return;
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