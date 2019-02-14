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

describe('Stats votes delta', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Stats votes delta for posts', () => {
    let firstPostId: number;
    let secondPostId: number;
    beforeEach(async () => {
      [firstPostId, secondPostId] = await Promise.all([
        PostsGenerator.createMediaPostByUserHimself(userVlad),
        PostsGenerator.createMediaPostByUserHimself(userVlad),
      ]);
    });

    it('posts only workflow - fresh stats table', async () => {
      await EntityEventParamGeneratorV2.createEventsAndGetSampleDataSet(
        firstPostId,
        secondPostId,
      );

      const deltaKey = 'upvotes_delta';
      const postsData = await EntityEventParamGeneratorV2.createPostUpvotesEventsAndGetSampleData(
        firstPostId,
        secondPostId,
      );

      await EntityCalculationService.updateEntitiesDeltas();

      const postEvents: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithPostEntityName(
          EventParamTypeDictionary.getPostUpvotesDelta(),
        );
      StatsHelper.checkManyEventsStructure(postEvents);

      const expectedSet: any = {};
      for (const postId in postsData) {
        expectedSet[postId] = {
          [deltaKey]: postsData[postId].upvotes.delta,
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
