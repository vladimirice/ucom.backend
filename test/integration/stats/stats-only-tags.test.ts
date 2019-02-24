/* eslint-disable guard-for-in */
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import EntityCalculationService = require('../../../lib/stats/service/entity-calculation-service');

import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import StatsHelper = require('../helpers/stats-helper');
import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');
import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');
import TagsCurrentRateProcessor = require('../../../lib/tags/service/tags-current-rate-processor');
import TagsRepository = require('../../../lib/tags/repository/tags-repository');
import _ = require('lodash');
import TagsModelProvider = require('../../../lib/tags/service/tags-model-provider');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};


let userVlad: UserModel;
let userJane: UserModel;

const ENTITY_NAME = TagsModelProvider.getEntityName();

describe('Stats for tags', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Stats current for tags', () => {
    it('check post types amounts for tags', async () => {
      const batchSize = 2;

      const tagOneTitle   = 'summer';
      const tagTwoTitle   = 'autumn';
      const tagThreeTitle = 'winter';

      await Promise.all([
        EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle),
        EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle),
        EntityTagsGenerator.createTagViaNewDirectPost(userVlad, userJane, tagOneTitle),

        EntityTagsGenerator.createTagViaNewPost(userVlad, tagTwoTitle),

        EntityTagsGenerator.createTagViaNewDirectPost(userJane, userVlad, tagThreeTitle),
      ]);

      await TagsCurrentRateProcessor.process();

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithTagEntityName(
        EventParamTypeDictionary.getTagItselfCurrentAmounts(),
      );

      expect(_.isEmpty(events)).toBeFalsy();

      expect(events.length).toBe(3);

      const [tagOneModel, tagTwoModel, tagThreeModel] = await Promise.all([
        TagsRepository.findOneByTitle(tagOneTitle),
        TagsRepository.findOneByTitle(tagTwoTitle),
        TagsRepository.findOneByTitle(tagThreeTitle),
      ]);

      const expectedSet = {
        [tagOneModel!.id]: {
          current_media_posts_amount: 2,
          current_direct_posts_amount: 1,
          current_posts_amount: 3,
          current_followers_amount: 0,
          importance: 0,
        },
        [tagTwoModel!.id]: {
          current_media_posts_amount: 1,
          current_direct_posts_amount: 0,
          current_posts_amount: 1,
          current_followers_amount: 0,
          importance: 0,
        },
        [tagThreeModel!.id]: {
          current_media_posts_amount: 0,
          current_direct_posts_amount: 1,
          current_posts_amount: 1,
          current_followers_amount: 0,
          importance: 0,
        },
      };

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(events, expectedSet);
    });
  });

  describe('Stats delta for tags', () => {
    let sampleDataSet;
    beforeEach(async () => {
      await EntityEventParamGeneratorV2.createManyEventsForRandomPostIds();
      await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
      await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();

      sampleDataSet = await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();
    });

    it('Stats posts delta for tags', async () => {
      const eventTypeRes      = EventParamTypeDictionary.getTagPostsTotalAmountDelta();

      const fieldNameInitial  = 'current_posts_amount';
      const fieldNameRes      = 'current_posts_amount_delta';
      const isFloat           = false;
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

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, 'posts_total_amount_delta', isFloat);
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

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, fieldNameRes, isFloat);
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

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, fieldNameRes, isFloat);
    });
  });
});

export {};
