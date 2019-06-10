"use strict";
const OffersModel = require("../models/offers-model");
const ProcessStatusesDictionary = require("../../common/dictionary/process-statuses-dictionary");
const AffiliatesAttributionIdsDictionary = require("../dictionary/affiliates-attribution-ids-dictionary");
const AffiliatesParticipationIdsDictionary = require("../dictionary/affiliates-participation-ids-dictionary");
const config = require('config');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
class OffersCreatorService {
    static async createOfferForRegistration(title, postId, startedAt, finishedAt = null) {
        const toInsert = {
            started_at: startedAt,
            finished_at: finishedAt,
            post_id: postId,
            status: ProcessStatusesDictionary.new(),
            title: title,
            attribution_id: AffiliatesAttributionIdsDictionary.firstWins(),
            event_id: EventsIds.registration(),
            participation_id: AffiliatesParticipationIdsDictionary.all(),
            redirect_url_template: `${config.servers.redirect}`,
        };
        const offer = await OffersModel.query()
            .insert(toInsert);
        const redirectUrlTemplate = `${config.servers.redirect}/${offer.hash}/{account_name}`;
        await offer
            .$query()
            .patch({
            redirect_url_template: redirectUrlTemplate
        });
        return offer;
    }
}
module.exports = OffersCreatorService;
