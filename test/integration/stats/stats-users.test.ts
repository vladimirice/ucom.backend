/* eslint-disable guard-for-in */
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');

import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import StatsHelper = require('../helpers/stats-helper');

import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');
import UosAccountsPropertiesGenerator = require('../../generators/blockchain/importance/uos-accounts-properties-generator');
import MockHelper = require('../helpers/mock-helper');
import UosAccountsPropertiesUpdateService = require('../../../lib/uos-accounts-properties/service/uos-accounts-properties-update-service');
import CommonChecker = require('../../helpers/common/common-checker');
import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');
import EntityCalculationService = require('../../../lib/stats/service/entity-calculation-service');
import UsersModelProvider = require('../../../lib/users/users-model-provider');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const ENTITY_NAME = UsersModelProvider.getEntityName();

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('Stats for users', () => {
  let expectedUosParamsSet;

  beforeAll(async () => { await SeedsHelper.noGraphQlMockAllWorkers(); });
  afterAll(async () => { await SeedsHelper.afterAllWithGraphQl(); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();

    await MockHelper.mockUosAccountsPropertiesFetchService(userVlad, userJane, userPetr, userRokky);
    expectedUosParamsSet = UosAccountsPropertiesGenerator.getProcessedSampleDataAsExpectedSet(
      userVlad,
      userJane,
      userPetr,
      userRokky,
    );
    await UosAccountsPropertiesUpdateService.updateAll();
  });

  describe('Current stats for users', () => {
    it('calculate users posts', async () => {
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
    }, JEST_TIMEOUT);

    it('check uos accounts properties', async () => {
      const batchSize = 2;

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithUsersEntityName(
          EventParamTypeDictionary.getUserHimselfCurrentAmounts(),
        );

      CommonChecker.expectNotEmpty(events);
      expect(events.length).toBe(4);

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(events, expectedUosParamsSet);
    }, JEST_TIMEOUT);
  });

  describe('Stats delta for users', () => {
    let sampleDataSet;
    beforeEach(async () => {
      await EntityEventParamGeneratorV2.createManyEventsForRandomPostIds();
      await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();

      sampleDataSet = await EntityEventParamGeneratorV2.createManyEventsForUsers();
    }, JEST_TIMEOUT * 3);

    it('Stats posts delta for users', async () => {
      const eventTypeRes      = EventParamTypeDictionary.getUsersPostsTotalAmountDelta();

      const fieldNameRes      = 'total_delta';
      const fieldNameInitial  = 'total';
      const isFloat           = false;
      const sampleData        = sampleDataSet[fieldNameInitial];

      await EntityCalculationService.updateEntitiesDeltas();

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithUsersEntityName(eventTypeRes);
      StatsHelper.checkManyEventsStructure(events);

      StatsHelper.checkManyEventsJsonValuesBySampleData(
        events,
        sampleData,
        fieldNameInitial,
        fieldNameRes,
      );

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, 'posts_total_amount_delta', isFloat);
    });

    it('users stats scaled importance delta', async () => {
      const eventTypeRes      = EventParamTypeDictionary.getUsersScaledImportanceDelta();

      const fieldNameInitial  = 'scaled_importance';
      const fieldNameRes      = 'scaled_importance_delta';
      const isFloat           = true;

      const sampleData = sampleDataSet[fieldNameInitial];

      await EntityCalculationService.updateEntitiesDeltas();

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithUsersEntityName(eventTypeRes);

      StatsHelper.checkManyEventsJsonValuesBySampleData(
        events,
        sampleData,
        fieldNameInitial,
        fieldNameRes,
        isFloat,
      );

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, fieldNameRes, isFloat);
    });

    it('users stats scaled social rate delta', async () => {
      const eventTypeRes      = EventParamTypeDictionary.getUsersScaledSocialRateDelta();

      const fieldNameInitial  = 'scaled_social_rate';
      const fieldNameRes      = 'scaled_social_rate_delta';
      const isFloat           = true;

      const sampleData = sampleDataSet[fieldNameInitial];

      await EntityCalculationService.updateEntitiesDeltas();

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithUsersEntityName(eventTypeRes);

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
