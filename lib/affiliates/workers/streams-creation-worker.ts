import { WorkerOptionsDto } from '../../common/interfaces/options-dto';
import WorkerHelper = require('../../common/helper/worker-helper');
import StreamsCreatorService = require('../service/streams-creator-service');
import OffersModel = require('../models/offers-model');
import AffiliatesParticipationIdsDictionary = require('../dictionary/affiliates-participation-ids-dictionary');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

const options: WorkerOptionsDto = {
  processName: 'streams-creator',
  durationInSecondsToAlert: 50,
};

async function toExecute() {
  const offer: OffersModel = await OffersModel.query().findOne({
    participation_id: AffiliatesParticipationIdsDictionary.all(),
    event_id: EventsIds.registration(),
  });

  return StreamsCreatorService.createRegistrationStreamsForEverybody(offer);
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();

export {};
