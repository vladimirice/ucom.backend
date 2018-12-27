const UserActivitySerializer = require('../../users/job/user-activity-serializer');
const UserRepository = require('../../users/repository');
const { TransactionSender } = require('ucom-libs-social-transactions');
const UsersActivityRepository = require('../../users/repository').Activity;
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

const {ConsumerLogger} = require('../../../config/winston');

const EventIdDictionary = require('../../entities/dictionary/notifications-event-id-dictionary');

const activityIdsToSkip = [
  InteractionTypeDictionary.getOrgTeamInvitation(),
];

const eventIdsToSkip = [
  EventIdDictionary.getUserHasMentionedYouInPost(),
  EventIdDictionary.getUserHasMentionedYouInComment(),
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
      ConsumerLogger.warn(`EventIdsToSkip matches. Blockchain consumer skips and ack activity with ID ${activity.id} and event_id ${activity.event_id}`);

      return;
    }

    if (~activityIdsToSkip.indexOf(activity.activity_type_id)) {
      ConsumerLogger.warn(`activityIdsToSkip matches. Blockchain consumer skips and ack activity with ID ${activity.id} and event_id ${activity.event_id}`);

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