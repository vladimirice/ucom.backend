import { injectable } from 'inversify';
import { Request } from 'express';
import AffiliateUniqueIdService = require('../affiliate-unique-id-service');
import AffiliatesActionsValidator = require('../../validators/affiliates-actions-validator');
import { ApiLogger } from '../../../../config/winston';
import OffersModel = require('../../models/offers-model');
import OffersRepository = require('../../repository/offers-repository');
import ConversionsModel = require('../../models/conversions-model');
import { transaction } from 'objection';
import UsersActivityRepository = require('../../../users/repository/users-activity-repository');
import { Transaction } from 'knex';
import ActivityGroupDictionary = require('../../../activity/activity-group-dictionary');
import { UserModel } from '../../../users/interfaces/model-interfaces';
import UsersModelProvider = require('../../../users/users-model-provider');
import ClicksModel = require('../../models/clicks-model');
import StreamsModel = require('../../models/streams-model');
import ProcessStatusesDictionary = require('../../../common/dictionary/process-statuses-dictionary');
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import UserActivityService = require('../../../users/user-activity-service');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

@injectable()
class RegistrationConversionService {
  public async processReferral(
    request: Request,
    newUser: UserModel,
  ) {
    const uniqueId: string | null =
      await AffiliateUniqueIdService.extractUniqueIdFromRequestOrNull(request);

    // No unique id - not required to process anything
    if (!uniqueId) {
      return;
    }


    const { body } = request;
    if (!body.affiliates_actions) {
      return;
    }

    const affiliatesActions = JSON.parse(body.affiliates_actions);

    if (!Array.isArray(affiliatesActions) || affiliatesActions.length !== 1) {
      this.logReferralError('affiliates_actions must be one-element array', affiliatesActions);

      return;
    }

    const affiliatesAction = affiliatesActions[0];

    const { error: validationErrors } = AffiliatesActionsValidator.validateRegistrationReferral(affiliatesAction);
    if (validationErrors) {
      this.logReferralError('Malformed affiliates_actions', affiliatesActions, validationErrors);

      return;
    }

    const offer: OffersModel = await OffersRepository.getRegistrationOffer();
    const stream: StreamsModel = await StreamsModel.query()
      .findOne({
        account_name: affiliatesAction.account_name_source,
        offer_id: offer.id,
      });


    if (!stream) {
      this.logReferralError(`No stream for account name ${affiliatesAction.account_name_source} and offer ID ${offer.id}`, affiliatesActions);

      return;
    }

    const click: ClicksModel = await ClicksModel.query()
      .findOne({
        user_unique_id: uniqueId,
        offer_id:       offer.id,
      })
      .andWhere('stream_id', '=', stream.id);

    if (!click) {
      this.logReferralError(`No click for uniqueId: ${uniqueId}, offerId: ${offer.id}, stream ID: ${stream.id}`, affiliatesActions);

      return;
    }

    let trx;
    let activity;
    try {
      trx = await transaction.start(OffersModel.knex());
      activity =
        await this.createReferralActivity(affiliatesAction.signed_transaction, newUser.id, stream.user_id, trx);

      await ConversionsModel.query(trx)
        .insert({
          offer_id:           offer.id,
          stream_id:          stream.id,
          click_id:           click.id,
          users_activity_id:  activity.id,

          user_id:            newUser.id,
          status:             ProcessStatusesDictionary.new(),
          json_headers:       request.headers,
          referer:            request.headers.referer || '',
        });

      await trx.commit();
    } catch (error) {
      // Log an error via ErrorEventToLogDto
      await trx.rollback();
      this.logReferralError('An error during the writing transaction', affiliatesActions, error);
    }

    await UserActivityService.sendPayloadToRabbit(activity);
  }

  private async createReferralActivity(
    signedTransaction: string,
    newUserId: number,
    referrerUserId: number,
    trx: Transaction,
  ) {
    const eventId         = EventsIds.referral();

    const activityTypeId  = eventId;
    const activityGroupId = ActivityGroupDictionary.getGroupUserUserInteraction();
    const entityName      = UsersModelProvider.getEntityName();

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       newUserId,
      entity_id_to:       referrerUserId,
      entity_name:        entityName,
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return UsersActivityRepository.createNewKnexActivity(data, trx);
  }

  private logReferralError(
    whatIsWrong: string,
    affiliatesActions: StringToAnyCollection,
    errors: StringToAnyCollection = {},
  ) {
    ApiLogger.error('Malformed referral registration. Must proceed the registration. Observe this situation manually', {
      whatIsWrong,
      affiliatesActions,
      errors,
      service: 'registration-conversion-service',
    });
  }
}

export = RegistrationConversionService;
