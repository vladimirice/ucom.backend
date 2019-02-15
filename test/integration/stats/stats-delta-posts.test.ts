/* eslint-disable guard-for-in */
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { StatsEventsOptions } from '../../interfaces/options-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import EntityCalculationService = require('../../../lib/stats/service/entity-calculation-service');

import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import StatsHelper = require('../helpers/stats-helper');
import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');

import RequestHelper = require('../helpers/request-helper');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

describe('Stats delta related to posts', () => {
  let sampleDataSet;

  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    await SeedsHelper.beforeAllRoutine();
  });

  describe('posts stats delta - not importance', () => {
    beforeEach(async () => {
      await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
      await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();
      sampleDataSet = await EntityEventParamGeneratorV2.createManyEventsForRandomPostIds();
    });

    it('posts only workflow - fresh stats table', async () => {
      const fieldNameInitial = 'upvotes';
      const fieldNameRes = 'upvotes_delta';
      const sampleData = sampleDataSet[fieldNameInitial];

      await EntityCalculationService.updateEntitiesDeltas();

      const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(
        EventParamTypeDictionary.getPostUpvotesDelta(),
      );
      StatsHelper.checkManyEventsStructure(events);

      StatsHelper.checkManyEventsJsonValuesBySampleData(
        events,
        sampleData,
        fieldNameInitial,
        fieldNameRes,
      );
    });

    it('posts stats activity index delta', async () => {
      const fieldNameInitial = 'activity_index';
      const fieldNameRes = 'activity_index_delta';
      const eventType = EventParamTypeDictionary.getPostActivityIndexDelta();
      const sampleData = sampleDataSet[fieldNameInitial];

      await EntityCalculationService.updateEntitiesDeltas();

      const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(eventType);

      StatsHelper.checkManyEventsJsonValuesBySampleData(
        events,
        sampleData,
        fieldNameInitial,
        fieldNameRes,
      );
    });
  });


  describe('Stats importance delta for posts', () => {
    let firstPostId: number;
    let secondPostId: number;
    beforeEach(async () => {
      await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
      await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();

      firstPostId   = RequestHelper.generateRandomNumber(0, 1000, 0);
      secondPostId  = RequestHelper.generateRandomNumber(0, 1000, 0) + 1;

      const options: StatsEventsOptions = {
        posts: {
          importance:     false,
          upvotes:        true,
          activityIndex:  true,
        },
      };

      return EntityEventParamGeneratorV2.createDifferentEventsForPosts(
        firstPostId,
        secondPostId,
        options,
      );
    });

    it('posts only workflow - fresh stats table', async () => {
      const entityName = PostsModelProvider.getEntityName();

      const initialFieldName = 'importance';

      const postsData = await EntityEventParamGeneratorV2.createEventsAndGetExpectedDataSet(
        firstPostId,
        secondPostId,
        entityName,
        EventParamTypeDictionary.getCurrentBlockchainImportance(),
        initialFieldName,
      );

      await EntityCalculationService.updateEntitiesDeltas();

      const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getBlockchainImportanceDelta(),
          );
      StatsHelper.checkManyEventsStructure(postEvents);

      postEvents.forEach((event) => {
        event.json_value.data.importance_delta = +event.json_value.data.importance_delta.toFixed(2);
      });

      const expectedSet: any = {};
      for (const postId in postsData) {
        expectedSet[postId] = {
          importance_delta: +postsData[postId].importance.delta.toFixed(2),
        };
      }

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(
        postEvents,
        expectedSet,
      );
    });

    it('Check situation - no before records (no rating yet) - entity is newcomer-star', async () => {
      const postsData =
          await EntityEventParamGeneratorV2.createEventsAndGetSampleDataSetForFirstOnlyAfter(
            firstPostId,
            secondPostId,
          );

      await EntityCalculationService.updateEntitiesDeltas();

      const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getBlockchainImportanceDelta(),
          );
      StatsHelper.checkManyEventsStructure(postEvents);

      postEvents.forEach((event) => {
        event.json_value.data.importance_delta = +event.json_value.data.importance_delta.toFixed(2);
      });

      const expectedSet: any = {};
      for (const postId in postsData) {
        expectedSet[postId] = {
          importance_delta: +postsData[postId].importance.delta.toFixed(2),
        };
      }

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(
        postEvents,
        expectedSet,
      );
    });

    // tslint:disable-next-line:max-line-length
    it('Check situation - no after records (rating is disappeared somehow) - make delta zero', async () => {
      const postsData =
          await EntityEventParamGeneratorV2.createEventsAndGetSampleDataSetForSecondOnlyBefore(
            firstPostId,
            secondPostId,
          );

      await EntityCalculationService.updateEntitiesDeltas();

      const postEvents: EntityEventParamDto[] =
          await EntityEventRepository.findManyEventsWithPostEntityName(
            EventParamTypeDictionary.getBlockchainImportanceDelta(),
          );
      StatsHelper.checkManyEventsStructure(postEvents);

      postEvents.forEach((event) => {
        event.json_value.data.importance_delta = +event.json_value.data.importance_delta.toFixed(2);
      });

      const expectedSet: any = {};
      for (const postId in postsData) {
        expectedSet[postId] = {
          importance_delta: +postsData[postId].importance.delta.toFixed(2),
        };
      }

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(
        postEvents,
        expectedSet,
      );
    });
  });
});

export {};
