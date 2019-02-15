/* eslint-disable guard-for-in */
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import EntityCalculationService = require('../../../lib/stats/service/entity-calculation-service');

import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import StatsHelper = require('../helpers/stats-helper');
import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

let sampleDataSet;

describe('Stats delta for tags', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    await SeedsHelper.beforeAllRoutine();
    await EntityEventParamGeneratorV2.createManyEventsForRandomPostIds();
    await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
    sampleDataSet = await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();
  });

  it('Stats posts delta for tags', async () => {
    const eventTypeRes      = EventParamTypeDictionary.getTagPostsTotalAmountDelta();

    const fieldNameInitial  = 'current_posts_amount';
    const fieldNameRes      = 'current_posts_amount_delta';
    const sampleData = sampleDataSet[fieldNameInitial];

    await EntityCalculationService.updateEntitiesDeltas();

    const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithTagEntityName(eventTypeRes);
    StatsHelper.checkManyEventsStructure(events);

    StatsHelper.checkManyEventsJsonValuesBySampleData(
      events,
      sampleData,
      fieldNameInitial,
      fieldNameRes,
    );
  });

  it('tags stats activity index delta', async () => {
    const eventTypeRes      = EventParamTypeDictionary.getTagsActivityIndexDelta();

    const fieldNameInitial  = 'activity_index';
    const fieldNameRes      = 'activity_index_delta';
    const isFloat           = true;

    const sampleData = sampleDataSet[fieldNameInitial];

    await EntityCalculationService.updateEntitiesDeltas();

    const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithTagEntityName(eventTypeRes);
    StatsHelper.checkManyEventsStructure(events);

    StatsHelper.checkManyEventsJsonValuesBySampleData(
      events,
      sampleData,
      fieldNameInitial,
      fieldNameRes,
      isFloat,
    );
  });

  it('tags stats importance delta', async () => {
    const eventTypeRes      = EventParamTypeDictionary.getTagsImportanceDelta();

    const fieldNameInitial  = 'importance';
    const fieldNameRes      = 'importance_delta';
    const isFloat           = true;

    const sampleData = sampleDataSet[fieldNameInitial];

    await EntityCalculationService.updateEntitiesDeltas();

    const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithTagEntityName(eventTypeRes);

    StatsHelper.checkManyEventsJsonValuesBySampleData(
      events,
      sampleData,
      fieldNameInitial,
      fieldNameRes,
      isFloat,
    );
  });
});

export {};
