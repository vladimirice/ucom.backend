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

describe('Stats delta for organizations', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    await SeedsHelper.beforeAllRoutine();
    await EntityEventParamGeneratorV2.createManyEventsForRandomPostIds();
    await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();
    sampleDataSet = await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
  });

  it('org stats activity index delta', async () => {
    const eventTypeRes      = EventParamTypeDictionary.getOrgsActivityIndexDelta();

    const fieldNameInitial  = 'activity_index';
    const fieldNameRes      = 'activity_index_delta';
    const isFloat           = true;

    const sampleData = sampleDataSet[fieldNameInitial];

    await EntityCalculationService.updateEntitiesDeltas();

    const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithOrgEntityName(eventTypeRes);
    StatsHelper.checkManyEventsStructure(events);

    StatsHelper.checkManyEventsJsonValuesBySampleData(
      events,
      sampleData,
      fieldNameInitial,
      fieldNameRes,
      isFloat,
    );
  });

  it('Stats posts delta for orgs', async () => {
    const eventTypeRes      = EventParamTypeDictionary.getOrgPostsTotalAmountDelta();

    const fieldNameRes      = 'total_delta';
    const fieldNameInitial  = 'total';
    const sampleData = sampleDataSet[fieldNameInitial];

    await EntityCalculationService.updateEntitiesDeltas();

    const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithOrgEntityName(eventTypeRes);
    StatsHelper.checkManyEventsStructure(events);

    StatsHelper.checkManyEventsJsonValuesBySampleData(
      events,
      sampleData,
      fieldNameInitial,
      fieldNameRes,
    );
  });

  it('smoke stats importance delta test for org', async () => {
    const eventType = EventParamTypeDictionary.getBlockchainImportanceDelta();
    const fieldNameInitial  = 'importance';
    const fieldNameRes      = 'importance_delta';
    const isFloat = true;

    const sampleData = sampleDataSet[fieldNameInitial];

    await EntityCalculationService.updateEntitiesDeltas();

    const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithOrgEntityName(eventType);
    StatsHelper.checkManyEventsStructure(events);

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
