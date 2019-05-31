"use strict";
const AffiliateUniqueIdService = require("../affiliate-unique-id-service");
const OffersModel = require("../../models/offers-model");
const errors_1 = require("../../../api/errors");
const NumbersHelper = require("../../../common/helper/numbers-helper");
const winston_1 = require("../../../../config/winston");
const ClicksRepository = require("../../repository/clicks-repository");
const UnprocessableEntityError = require("../../errors/unprocessable-entity-error");
const { Interactions } = require('ucom-libs-wallet').Dictionary;
const statuses = require('statuses');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
// to speed up wrong user input requests
const allowedEvents = [
    EventsIds.registration(),
];
const eventIdToAction = {
    [EventsIds.registration()]: Interactions.referral(),
};
class AttributionService {
    static async process(request) {
        const jwtToken = AffiliateUniqueIdService.getUniqueIdJwtTokenFromCookieOrNull(request);
        if (jwtToken === null) {
            throw new UnprocessableEntityError();
        }
        const { eventId, action } = this.getEventIdAndActionOrException(request);
        const uniqueId = AffiliateUniqueIdService.extractUniqueIdFromJwtTokenOrUnauthorizedError(jwtToken);
        const winnerAccountName = await this.getWinnerAccountNameIfPossible(eventId, uniqueId);
        return {
            responseStatus: statuses('OK'),
            responseBody: {
                actions: [
                    {
                        action,
                        account_name_source: winnerAccountName,
                    },
                ],
            }
        };
    }
    static async getWinnerAccountNameIfPossible(eventId, uniqueId) {
        const offer = await this.getOfferOrError(eventId);
        const winnerAccountName = await ClicksRepository.getAccountNameByAttributionModel(offer, uniqueId);
        if (winnerAccountName === null) {
            winston_1.ApiLogger.error(`
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
    static async getOfferOrError(eventId) {
        const offers = await OffersModel.query().where({
            event_id: eventId,
        });
        if (offers.length === 0) {
            throw new errors_1.AppError(`
        Now it is supposed that it must be one offer for event_id: ${eventId}. In the future might be not when a lot of different referral programs exist
      `);
        }
        if (offers.length !== 1) {
            throw new errors_1.AppError(`Only one offer is expected for eventId: ${eventId}. Please consider to develop a feature for more than one offer`);
        }
        return offers[0];
    }
    static getEventIdAndActionOrException(request) {
        const { body } = request;
        if (!body.event_id) {
            throw new errors_1.BadRequestError(`event_id must be provided. Request body is: ${JSON.stringify(body)}`);
        }
        const eventId = +body.event_id;
        NumbersHelper.isNumberFinitePositiveIntegerOrBadRequestError(eventId);
        if (!allowedEvents.includes(eventId)) {
            throw new errors_1.BadRequestError(`event ID ${eventId} is not allowed. Allowed values are: ${allowedEvents}`);
        }
        const action = eventIdToAction[eventId];
        if (!action) {
            throw new errors_1.AppError(`There is no action for eventId: ${eventId}`);
        }
        return {
            eventId,
            action,
        };
    }
}
module.exports = AttributionService;
