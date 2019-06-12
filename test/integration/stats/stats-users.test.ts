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

import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

const ENTITY_NAME = OrganizationsModelProvider.getEntityName();

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('Stats for users', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Current stats for users', () => {
    it('calculate organization-related posts', async () => {
      const batchSize = 2;
      const vladOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      const [
        vladMediaPostsIdsFromOrg,
        janeHerselfMediaPostsIds,
      ] = await Promise.all([
        PostsGenerator.createManyMediaPostsOfOrganization(userVlad, vladOrgId, 1),
        PostsGenerator.createManyDefaultMediaPostsByUserHimself(userJane, 2),

        PostsGenerator.createManyDefaultMediaPostsByUserHimself(userVlad, 3),

        PostsGenerator.createManyDirectPostsForUserAndGetIds(userVlad, userJane, 2),
        PostsGenerator.createManyDirectPostsForOrganization(userJane, vladOrgId, 3),
      ]);

      // disturbance
      await Promise.all([
        PostsGenerator.createRepostOfUserPost(userVlad, janeHerselfMediaPostsIds[0]),
        PostsGenerator.createRepostOfUserPost(userVlad, janeHerselfMediaPostsIds[1]),

        PostsGenerator.createRepostOfUserPost(userJane, vladMediaPostsIdsFromOrg[0]),
      ]);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithUsersEntityName(
          EventParamTypeDictionary.getUsersPostsCurrentAmount(),
        );

      const expectedSet = {
        [userVlad.id]: {
          media_posts:  4,
          direct_posts: 2,
          total:        6,
        },
        [userJane.id]: {
          media_posts:  2,
          direct_posts: 3,
          total:        5,
        },
      };

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(events, expectedSet);

      const userVladEvent = events.find(item => +item.entity_id === userVlad.id)!;
      const userJaneEvent = events.find(item => +item.entity_id === userJane.id)!;

      expect(+userVladEvent.result_value).toBe(expectedSet[userVlad.id].total);
      expect(+userJaneEvent.result_value).toBe(expectedSet[userJane.id].total);
    }, JEST_TIMEOUT_DEBUG);
  });

  describe('Stats delta for users', () => {
    let sampleDataSet;
    beforeEach(async () => {
      await SeedsHelper.beforeAllRoutine();
      await EntityEventParamGeneratorV2.createManyEventsForRandomPostIds();
      await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();
      await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();

      sampleDataSet = await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
    });

    it('Stats posts delta for users', async () => {
      // TODO
      const eventTypeRes      = EventParamTypeDictionary.getOrgPostsTotalAmountDelta();

      const fieldNameRes      = 'total_delta';
      const fieldNameInitial  = 'total';
      const isFloat           = false;
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

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, 'posts_total_amount_delta', isFloat);
    });

    it('smoke stats importance delta test for users', async () => {
      // TODO
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

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, fieldNameRes, isFloat);
    });
  });
});

export {};
