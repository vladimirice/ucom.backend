"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const inversify_1 = require("inversify");
const objection_1 = require("objection");
const winston_1 = require("../../../../config/winston");
const errors_1 = require("../../../api/errors");
const AffiliateUniqueIdService = require("../affiliate-unique-id-service");
const AffiliatesActionsValidator = require("../../validators/affiliates-actions-validator");
const OffersModel = require("../../models/offers-model");
const OffersRepository = require("../../repository/offers-repository");
const ConversionsModel = require("../../models/conversions-model");
const UsersActivityRepository = require("../../../users/repository/users-activity-repository");
const ActivityGroupDictionary = require("../../../activity/activity-group-dictionary");
const UsersModelProvider = require("../../../users/users-model-provider");
const ClicksModel = require("../../models/clicks-model");
const StreamsModel = require("../../models/streams-model");
const ProcessStatusesDictionary = require("../../../common/dictionary/process-statuses-dictionary");
const UnprocessableEntityError = require("../../errors/unprocessable-entity-error");
const UserActivitySerializer = require("../../../users/job/user-activity-serializer");
const ActivityProducer = require("../../../jobs/activity-producer");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
let RegistrationConversionService = class RegistrationConversionService {
    async processReferral(request, currentUser) {
        const { uniqueId, affiliatesAction } = this.getUniqueIdAndAffiliatesAction(request);
        const offer = await OffersRepository.getRegistrationOffer();
        const stream = await StreamsModel.query()
            .findOne({
            account_name: affiliatesAction.account_name_source,
            offer_id: offer.id,
        });
        if (!stream) {
            this.processReferralError(`No stream for account name ${affiliatesAction.account_name_source} and offer ID ${offer.id}`, uniqueId, affiliatesAction);
        }
        const click = await ClicksModel.query()
            .findOne({
            user_unique_id: uniqueId,
            offer_id: offer.id,
        })
            .andWhere('stream_id', '=', stream.id);
        if (!click) {
            this.processReferralError(`No click for uniqueId: ${uniqueId}, offerId: ${offer.id}, stream ID: ${stream.id}`, uniqueId, affiliatesAction);
        }
        let trx;
        let activity;
        try {
            trx = await objection_1.transaction.start(OffersModel.knex());
            activity =
                await this.createReferralActivity(affiliatesAction.signed_transaction, currentUser.id, stream.user_id, trx);
            await ConversionsModel.query(trx)
                .insert({
                offer_id: offer.id,
                stream_id: stream.id,
                click_id: click.id,
                users_activity_id: activity.id,
                user_id: currentUser.id,
                status: ProcessStatusesDictionary.new(),
                json_headers: request.headers,
                referer: request.headers.referer || '',
            });
            await trx.commit();
        }
        catch (error) {
            // Log an error via ErrorEventToLogDto
            await trx.rollback();
            this.processReferralError('An error during the writing transaction', uniqueId, affiliatesAction, error);
        }
        const job = UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);
        await ActivityProducer.publishWithUserActivity(job);
    }
    // eslint-disable-next-line class-methods-use-this
    getUniqueIdAndAffiliatesAction(request) {
        const uniqueId = AffiliateUniqueIdService.extractUniqueIdFromRequestOrNull(request);
        if (!uniqueId) {
            throw new errors_1.BadRequestError(`It is required to send a cookie: ${CommonHeaders.UNIQUE_ID}`);
        }
        const { body } = request;
        const { error: validationErrors } = AffiliatesActionsValidator.validateRegistrationReferral(body);
        if (validationErrors) {
            throw new errors_1.JoiBadRequestError(validationErrors);
        }
        return {
            uniqueId,
            affiliatesAction: body,
        };
    }
    // eslint-disable-next-line class-methods-use-this
    async createReferralActivity(signedTransaction, newUserId, referrerUserId, trx) {
        const eventId = EventsIds.referral();
        const activityTypeId = eventId;
        const activityGroupId = ActivityGroupDictionary.getGroupUserUserInteraction();
        const entityName = UsersModelProvider.getEntityName();
        const data = {
            activity_type_id: activityTypeId,
            activity_group_id: activityGroupId,
            user_id_from: newUserId,
            entity_id_to: referrerUserId,
            entity_name: entityName,
            signed_transaction: signedTransaction,
            event_id: eventId,
        };
        return UsersActivityRepository.createNewKnexActivity(data, trx);
    }
    /**
     * It is forbidden to interrupt a registration because of a referral errors. But we must know about errors
     */
    // eslint-disable-next-line class-methods-use-this
    processReferralError(whatIsWrong, uniqueId, affiliatesAction = null, errors = {}) {
        winston_1.ApiLogger.error('Malformed referral registration. Must proceed the registration. Observe this situation manually', {
            whatIsWrong,
            uniqueId,
            affiliatesAction,
            errors,
            service: 'registration-conversion-service',
        });
        throw new UnprocessableEntityError();
    }
};
RegistrationConversionService = __decorate([
    inversify_1.injectable()
], RegistrationConversionService);
module.exports = RegistrationConversionService;
