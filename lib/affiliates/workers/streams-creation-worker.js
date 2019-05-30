"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerHelper = require("../../common/helper/worker-helper");
const StreamsCreatorService = require("../service/streams-creator-service");
const OffersModel = require("../models/offers-model");
const AffiliatesParticipationIdsDictionary = require("../dictionary/affiliates-participation-ids-dictionary");
const NotificationsEventIdDictionary = require("../../entities/dictionary/notifications-event-id-dictionary");
const options = {
    processName: 'streams-creator',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    const offer = await OffersModel.query().findOne({
        participation_id: AffiliatesParticipationIdsDictionary.all(),
        event_id: NotificationsEventIdDictionary.getRegistration(),
    });
    return StreamsCreatorService.createRegistrationStreamsForEverybody(offer);
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
