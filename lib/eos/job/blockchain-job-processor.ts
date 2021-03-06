/* eslint-disable no-console */
/* tslint:disable:max-line-length */
import { EventsIdsDictionary, InteractionTypesDictionary } from 'ucom.libs.common';
import { IActivityOptions } from '../interfaces/activity-interfaces';
import { AppError } from '../../api/errors';

import UsersActivityRepository = require('../../users/repository/users-activity-repository');

const { SocialApi } = require('ucom-libs-wallet');

const usersActivityRepository = require('../../users/repository').Activity;

const { ConsumerLogger } = require('../../../config/winston');

const activityIdsToSkip = [
  InteractionTypesDictionary.getOrgTeamInvitation(),
];

const eventIdsToSkip = [
  EventsIdsDictionary.getUserHasMentionedYouInPost(),
  EventsIdsDictionary.getUserHasMentionedYouInComment(),
];

class BlockchainJobProcessor {
  static async process(message: { id: number, options: IActivityOptions }) {
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

    let blockchainResponse;
    if (message.options && message.options.eosJsV2) {
      blockchainResponse = await this.pushByEosJsV2(message);
    } else {
      throw new AppError('Only eosJsV2 is supported');
    }

    if (blockchainResponse === null
      && message.options
      && message.options.suppressEmptyTransactionError === true
    ) {
      console.log(`This message has empty signed transaction and skipped by options: ${JSON.stringify(message)}`);

      return;
    }

    await UsersActivityRepository.setIsSentToBlockchainAndResponse(
      message.id,
      JSON.stringify(blockchainResponse),
    );
  }

  private static async pushByEosJsV2(message): Promise<any> {
    const signedTransaction: string | null =
      await UsersActivityRepository.getSignedTransactionByActivityId(message.id);

    // #task - backward compatibility. Remove in the future
    if (!signedTransaction
      && message.options
      && message.options.suppressEmptyTransactionError === true) {
      return null;
    }

    if (!signedTransaction) {
      throw new Error(`There is no activity data with id: ${message.id}`);
    }

    return SocialApi.pushSignedTransactionJson(signedTransaction);
  }
}

export = BlockchainJobProcessor;
