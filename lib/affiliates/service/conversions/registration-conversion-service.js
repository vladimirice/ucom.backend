"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const inversify_1 = require("inversify");
const AffiliateUniqueIdService = require("../affiliate-unique-id-service");
const AffiliatesActionsValidator = require("../../validators/affiliates-actions-validator");
const winston_1 = require("../../../../config/winston");
const OffersModel = require("../../models/offers-model");
const OffersRepository = require("../../repository/offers-repository");
const ConversionsModel = require("../../models/conversions-model");
const objection_1 = require("objection");
const UsersActivityRepository = require("../../../users/repository/users-activity-repository");
const ActivityGroupDictionary = require("../../../activity/activity-group-dictionary");
const UsersModelProvider = require("../../../users/users-model-provider");
const ClicksModel = require("../../models/clicks-model");
const StreamsModel = require("../../models/streams-model");
const ProcessStatusesDictionary = require("../../../common/dictionary/process-statuses-dictionary");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
let RegistrationConversionService = class RegistrationConversionService {
    async processReferral(request, newUser) {
        const uniqueId = await AffiliateUniqueIdService.extractUniqueIdFromRequestOrNull(request);
        // No unique id - not required to process anything
        if (uniqueId) {
            return;
        }
        const { body } = request;
        if (!body.affiliates_actions) {
            return;
        }
        const affiliatesActions = JSON.parse(body.affiliates_actions);
        const { error: validationErrors } = AffiliatesActionsValidator.validateRegistrationReferral(body);
        if (validationErrors) {
            winston_1.ApiLogger.error('Malformed referral registration. Must proceed the registration. Observe this situation manually', {
                service: 'registration-conversion-service',
                affiliatesActions: JSON.stringify(affiliatesActions),
                validationErrors: JSON.stringify(validationErrors),
            });
            return;
        }
        const offer = await OffersRepository.getRegistrationOffer();
        const stream = StreamsModel.query()
            .where({
            account_name: affiliatesActions.account_name_source,
            offer_id: offer.id,
        });
        if (!stream) {
            // TODO - refactor
            winston_1.ApiLogger.error(`There is no stream with account name: ${affiliatesActions.account_name_source}. ust proceed the registration. Observe this situation manually`, {
                service: 'registration-conversion-service',
                affiliatesActions: JSON.stringify(affiliatesActions),
                validationErrors: JSON.stringify(validationErrors),
            });
            return;
        }
        const click = await ClicksModel.query()
            .where({
            user_unique_id: uniqueId,
            offer_id: offer.id,
        })
            .andWhere('stream_id', '=', stream.id)
            .limit(1);
        if (!click) {
            winston_1.ApiLogger.error(`There is no click for the given params. Must proceed the registration. Observe this situation manually`, {
                service: 'registration-conversion-service',
                affiliatesActions: JSON.stringify(affiliatesActions),
                offerId: offer.id,
            });
            return;
        }
        let trx;
        let activity;
        try {
            trx = await objection_1.transaction.start(OffersModel.knex());
            activity =
                await this.createReferralActivity(body.signed_transaction, newUser.id, stream.user_id, trx);
            await ConversionsModel.query(trx)
                .insert({
                offer_id: offer.id,
                stream_id: stream.id,
                click_id: click.id,
                users_activity_id: activity.id,
                user_id: newUser.id,
                status: ProcessStatusesDictionary.new(),
                json_headers: request.headers,
                referer: request.headers.referer || '',
            });
            await trx.commit();
        }
        catch (err) {
            // Log an error via ErrorEventToLogDto
            await trx.rollback();
            return;
        }
        // TODO - send activity to the rabbit after TDD
    }
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
};
RegistrationConversionService = __decorate([
    inversify_1.injectable()
], RegistrationConversionService);
module.exports = RegistrationConversionService;
