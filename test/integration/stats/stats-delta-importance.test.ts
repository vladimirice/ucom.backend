/* eslint-disable guard-for-in */
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import EntityCalculationService = require('../../../lib/stats/service/entity-calculation-service');

import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import StatsHelper = require('../helpers/stats-helper');
import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

describe('Stats importance delta', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Stats importance delta for posts', () => {
    let firstPostId: number;
    let secondPostId: number;
    beforeEach(async () => {
      [firstPostId, secondPostId] = await Promise.all([
        PostsGenerator.createMediaPostByUserHimself(userVlad),
        PostsGenerator.createMediaPostByUserHimself(userVlad),
      ]);
    });

    it('posts only workflow - fresh stats table', async () => {
      const postsData = await EntityEventParamGeneratorV2.createEventsAndGetSampleDataSet(
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
