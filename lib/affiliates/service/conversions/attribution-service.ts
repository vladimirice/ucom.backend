import AffiliateUniqueIdService = require('../affiliate-unique-id-service');
import { NumberToStringCollection, StringToAnyCollection } from '../../../common/interfaces/common-types';
import OffersModel = require('../../models/offers-model');
import { AppError, BadRequestError } from '../../../api/errors';
import NumbersHelper = require('../../../common/helper/numbers-helper');
import { ApiLogger } from '../../../../config/winston';
import ClicksRepository = require('../../repository/clicks-repository');
import UnprocessableEntityError = require('../../errors/unprocessable-entity-error');

const {  Interactions } = require('ucom-libs-wallet').Dictionary;

const statuses = require('statuses');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

// to speed up wrong user input requests
const allowedEvents: number[] = [
  EventsIds.registration(),
];

const eventIdToAction: NumberToStringCollection = {
  [EventsIds.registration()]: Interactions.referral(),
};

class AttributionService {
  public static async process(
    request: StringToAnyCollection,
  ): Promise<{responseStatus: number, responseBody: StringToAnyCollection}> {
    const jwtToken = AffiliateUniqueIdService.getUniqueIdJwtTokenFromCookieOrNull(request);

    if (jwtToken === null) {
      throw new UnprocessableEntityError();
    }

    const { eventId, action} = this.getEventIdAndActionOrException(request);
    const uniqueId = AffiliateUniqueIdService.extractUniqueIdFromJwtTokenOrUnauthorizedError(jwtToken);

    const winnerAccountName: string = await this.getWinnerAccountNameIfPossible(eventId, uniqueId);

    return {
      responseStatus: statuses('OK'),
      responseBody: {
        actions: [ // #task array is hardcoded here to determine an interface for the future many referral programs
          {
            action,
            account_name_source: winnerAccountName,
          },
        ],
      }
    }
  }

  private static async getWinnerAccountNameIfPossible(eventId: number, uniqueId: string): Promise<string> {
    const offer: OffersModel | null = await this.getOfferOrError(eventId);

    const winnerAccountName: string | null =
      await ClicksRepository.getAccountNameByAttributionModel(offer, uniqueId);

    if (winnerAccountName === null) {
      ApiLogger.error(`
        There is no any winner. Maybe user set a cookie by himself, but maybe it is an error. Let's skip it.
      `, {
        uniqueId,
        service: 'attribution-service',
        offerId: offer.id,
      });

      throw new UnprocessableEntityError();
    }

    return winnerAccountName;
  }

  private static async getOfferOrError(eventId: number): Promise<OffersModel> {
    const offers: OffersModel[] = await OffersModel.query().where({
      event_id: eventId,
    });

    if (offers.length === 0) {
      throw new AppError(`
        Now it is supposed that it must be one offer for event_id: ${eventId}. In the future might be not when a lot of different referral programs exist
      `);
    }

    if (offers.length !== 1) {
      throw new AppError(`Only one offer is expected for eventId: ${eventId}. Please consider to develop a feature for more than one offer`);
    }

    return offers[0];
  }

  private static getEventIdAndActionOrException(request): {eventId: number, action: string} {
    const { body } = request;

    if (!body.event_id) {
      throw new BadRequestError(`event_id must be provided. Request body is: ${JSON.stringify(body)}`);
    }

    const eventId: number = +body.event_id;
    NumbersHelper.isNumberFinitePositiveIntegerOrBadRequestError(eventId);

    if (!allowedEvents.includes(eventId)) {
      throw new BadRequestError(`event ID ${eventId} is not allowed. Allowed values are: ${allowedEvents}`)
    }

    const action = eventIdToAction[eventId];
    if (!action) {
      throw new AppError(`There is no action for eventId: ${eventId}`);
    }

    return {
      eventId,
      action,
    };
  }
}

export = AttributionService;
