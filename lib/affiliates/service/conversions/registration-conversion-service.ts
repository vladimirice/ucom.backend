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
import UnprocessableEntityError = require('../../errors/unprocessable-entity-error');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

interface IAffiliatesAction {
  offer_id:             number;
  account_name_source:  string;
  action:               string;
  signed_transaction:   string;
}

@injectable()
class RegistrationConversionService {
  public async processReferral(
    request: Request,
    newUser: UserModel,
  ) {
    const { uniqueId, affiliatesAction } = this.getUniqueIdAndAffiliatesAction(request);

    const offer: OffersModel = await OffersRepository.getRegistrationOffer();
    const stream: StreamsModel = await StreamsModel.query()
      .findOne({
        account_name: affiliatesAction.account_name_source,
        offer_id: offer.id,
      });

    if (!stream) {
      this.processReferralError(
        `No stream for account name ${affiliatesAction.account_name_source} and offer ID ${offer.id}`,
        uniqueId,
        affiliatesAction,
      );
    }

    const click: ClicksModel = await ClicksModel.query()
      .findOne({
        user_unique_id: uniqueId,
        offer_id:       offer.id,
      })
      .andWhere('stream_id', '=', stream.id);

    if (!click) {
      this.processReferralError(
        `No click for uniqueId: ${uniqueId}, offerId: ${offer.id}, stream ID: ${stream.id}`,
        uniqueId,
        affiliatesAction,
      );
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
      this.processReferralError('An error during the writing transaction', uniqueId, affiliatesAction, error);
    }

    await UserActivityService.sendPayloadToRabbit(activity);
  }

  private getUniqueIdAndAffiliatesAction(
    request: Request
  ): { uniqueId: string, affiliatesAction: IAffiliatesAction } {
    const uniqueId: string | null =
      AffiliateUniqueIdService.extractUniqueIdFromRequestOrNull(request);

    // No unique id - not required to process anything
    if (!uniqueId) {
      throw new UnprocessableEntityError();
    }

    const { body } = request;
    if (!body.affiliates_actions) {
      this.processReferralError('There is uniqueId but there is no affiliates_actions', uniqueId);
    }

    let affiliatesActions;
    try {
      affiliatesActions = JSON.parse(body.affiliates_actions);
    } catch (error) {
      if (error.name === 'SyntaxError') {
        this.processReferralError(
          'Malformed affiliates_actions JSON',
          uniqueId,
          body.affiliates_actions,
          error,
        );
      }

      this.processReferralError('json parsing error', uniqueId, body.affiliates_actions, error);
    }

    if (!Array.isArray(affiliatesActions) || affiliatesActions.length !== 1) {
      this.processReferralError('affiliates_actions must be one-element array', affiliatesActions);
    }

    const affiliatesAction = affiliatesActions[0];

    const { error: validationErrors } = AffiliatesActionsValidator.validateRegistrationReferral(affiliatesAction);
    if (validationErrors) {
      this.processReferralError('Malformed affiliates_actions', affiliatesActions, validationErrors);
    }

    return {
      uniqueId,
      affiliatesAction,
    }
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

  /**
   * It is forbidden to interrupt a registration because of a referral errors. But we must know about errors
   */
  private processReferralError(
    whatIsWrong: string,
    uniqueId: string,
    affiliatesAction: IAffiliatesAction | null = null,
    errors: StringToAnyCollection = {},
  ) {
    ApiLogger.error('Malformed referral registration. Must proceed the registration. Observe this situation manually', {
      whatIsWrong,
      uniqueId,
      affiliatesAction,
      errors,
      service: 'registration-conversion-service',
    });

    throw new UnprocessableEntityError();
  }
}

export = RegistrationConversionService;
