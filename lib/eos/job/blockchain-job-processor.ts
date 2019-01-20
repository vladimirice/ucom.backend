/* tslint:disable:max-line-length */
const userActivitySerializer = require('../../users/job/user-activity-serializer');
const userRepository = require('../../users/repository');
const { TransactionSender } = require('ucom-libs-social-transactions');
const usersActivityRepository = require('../../users/repository').Activity;
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

const { ConsumerLogger } = require('../../../config/winston');

const eventIdDictionary = require('../../entities/dictionary/notifications-event-id-dictionary');

const activityIdsToSkip = [
  InteractionTypeDictionary.getOrgTeamInvitation(),
];

const eventIdsToSkip = [
  eventIdDictionary.getUserHasMentionedYouInPost(),
  eventIdDictionary.getUserHasMentionedYouInComment(),
];

class BlockchainJobProcessor {
  static async process(message) {
    if (!message.id) {
      throw new Error(`Malformed message. ID is required. Message is: ${JSON.stringify(message)}`);
    }

    const activity = await usersActivityRepository.findOnlyItselfById(+message.id);
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

    const signedTransaction = await userActivitySerializer.getActivityDataToPushToBlockchain(message);
    const blockchainResponse = await TransactionSender.pushTransaction(signedTransaction.transaction);

    await userRepository.Activity.setIsSentToBlockchainAndResponse(
      message.id,
      JSON.stringify(blockchainResponse),
    );
  }
}

export = BlockchainJobProcessor;
