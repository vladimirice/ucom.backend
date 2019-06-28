"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerHelper = require("../../common/helper/worker-helper");
const StreamsCreatorService = require("../service/streams-creator-service");
const OffersModel = require("../models/offers-model");
const AffiliatesParticipationIdsDictionary = require("../dictionary/affiliates-participation-ids-dictionary");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const options = {
    processName: 'streams-creator',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    const offer = await OffersModel.query().findOne({
        participation_id: AffiliatesParticipationIdsDictionary.all(),
        event_id: EventsIds.registration(),
    });
    return StreamsCreatorService.createRegistrationStreamsForEverybody(offer);
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
