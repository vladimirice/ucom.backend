import { injectable } from 'inversify';
import { Request } from 'express';
import { transaction } from 'objection';
import { Transaction } from 'knex';
import { ApiLogger } from '../../../../config/winston';
import { UserModel } from '../../../users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import { BadRequestError, JoiBadRequestError } from '../../../api/errors';

import AffiliateUniqueIdService = require('../affiliate-unique-id-service');
import AffiliatesActionsValidator = require('../../validators/affiliates-actions-validator');
import OffersModel = require('../../models/offers-model');
import OffersRepository = require('../../repository/offers-repository');
import ConversionsModel = require('../../models/conversions-model');
import UsersActivityRepository = require('../../../users/repository/users-activity-repository');
import ActivityGroupDictionary = require('../../../activity/activity-group-dictionary');
import UsersModelProvider = require('../../../users/users-model-provider');
import ClicksModel = require('../../models/clicks-model');
import StreamsModel = require('../../models/streams-model');
import ProcessStatusesDictionary = require('../../../common/dictionary/process-statuses-dictionary');
import UnprocessableEntityError = require('../../errors/unprocessable-entity-error');
import UserActivitySerializer = require('../../../users/job/user-activity-serializer');
import ActivityProducer = require('../../../jobs/activity-producer');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

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
    currentUser: UserModel,
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
        await this.createReferralActivity(affiliatesAction.signed_transaction, currentUser.id, stream.user_id, trx);

      await ConversionsModel.query(trx)
        .insert({
          offer_id:           offer.id,
          stream_id:          stream.id,
          click_id:           click.id,
          users_activity_id:  activity.id,

          user_id:            currentUser.id,
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

    const job: string =
      UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);

    await ActivityProducer.publishWithUserActivity(job);
  }

  // eslint-disable-next-line class-methods-use-this
  private getUniqueIdAndAffiliatesAction(
    request: Request,
  ): { uniqueId: string, affiliatesAction: IAffiliatesAction } {
    const uniqueId: string | null =
      AffiliateUniqueIdService.extractUniqueIdFromRequestOrNull(request);

    if (!uniqueId) {
      throw new BadRequestError(`It is required to send a cookie: ${CommonHeaders.UNIQUE_ID}`);
    }

    const { body } = request;

    const { error: validationErrors } = AffiliatesActionsValidator.validateRegistrationReferral(body);
    if (validationErrors) {
      throw new JoiBadRequestError(validationErrors);
    }

    return {
      uniqueId,
      affiliatesAction: body,
    };
  }

  // eslint-disable-next-line class-methods-use-this
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
  // eslint-disable-next-line class-methods-use-this
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
