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
import OrganizationsHelper = require('../helpers/organizations-helper');
import PostsGenerator = require('../../generators/posts-generator');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

const ENTITY_NAME = OrganizationsModelProvider.getEntityName();

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

describe('Stats for organizations', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Current stats for organizations', () => {
    it('calculate organization followers amount', async () => {
      const batchSize = 2;
      const [orgOneId, orgTwoId, orgThreeId] = await Promise.all([
        OrganizationsGenerator.createOrgWithoutTeam(userVlad),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
        OrganizationsGenerator.createOrgWithoutTeam(userPetr),

        OrganizationsGenerator.createOrgWithoutTeam(userRokky), // by design
      ]);

      await OrganizationsHelper.requestToCreateOrgFollowHistory(userJane, orgOneId);
      await OrganizationsHelper.requestToFollowOrganization(orgOneId, userPetr);
      await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userRokky, orgOneId);

      await OrganizationsHelper.requestToFollowOrganization(orgTwoId, userPetr);
      await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userVlad, orgTwoId);
      await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userRokky, orgTwoId);

      await OrganizationsHelper.requestToFollowOrganization(orgThreeId, userRokky);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithOrgEntityName(
          EventParamTypeDictionary.getOrgFollowersCurrentAmount(),
        );

      const expectedSet = {
        [orgOneId]: {
          followers: 2,
        },
        [orgTwoId]: {
          followers: 1,
        },
        [orgThreeId]: {
          followers: 1,
        },
      };

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(events, expectedSet);

      const orgOneEvent    = events.find(item => +item.entity_id === orgOneId)!;
      const orgTwoEvent    = events.find(item => +item.entity_id === orgTwoId)!;
      const orgThreeEvent    = events.find(item => +item.entity_id === orgThreeId)!;

      expect(+orgOneEvent.result_value).toBe(2);
      expect(+orgTwoEvent.result_value).toBe(1);
      expect(+orgThreeEvent.result_value).toBe(1);
    });
    it('calculate organization-related posts', async () => {
      const batchSize = 2;
      const [orgOneId, orgTwoId, orgThreeId] = await Promise.all([
        OrganizationsGenerator.createOrgWithoutTeam(userVlad),
        OrganizationsGenerator.createOrgWithoutTeam(userJane),
        OrganizationsGenerator.createOrgWithoutTeam(userRokky),

        OrganizationsGenerator.createOrgWithoutTeam(userJane), // by design
      ]);

      await Promise.all([
        PostsGenerator.createManyMediaPostsOfOrganization(userVlad, orgOneId, 3),
        PostsGenerator.createDirectPostForOrganization(userJane, orgOneId),
        PostsGenerator.createDirectPostForOrganization(userPetr, orgOneId),

        PostsGenerator.createDirectPostForOrganization(userPetr, orgTwoId),
        PostsGenerator.createMediaPostOfOrganization(userRokky, orgThreeId),
      ]);

      await EntityJobExecutorService.processEntityEventParam(batchSize);

      const events: EntityEventParamDto[] =
        await EntityEventRepository.findManyEventsWithOrgEntityName(
          EventParamTypeDictionary.getOrgPostsCurrentAmount(),
        );

      const expectedSet = {
        [orgOneId]: {
          media_posts: 3,
          direct_posts: 2,
          total: 5,
        },
        [orgTwoId]: {
          media_posts: 0,
          direct_posts: 1,
          total: 1,
        },
        [orgThreeId]: {
          media_posts: 1,
          direct_posts: 0,
          total: 1,
        },
      };

      StatsHelper.checkManyEventsJsonValuesByExpectedSet(events, expectedSet);

      const postOneEvent    = events.find(item => +item.entity_id === orgOneId)!;
      const postTwoEvent    = events.find(item => +item.entity_id === orgTwoId)!;
      const postThreeEvent  = events.find(item => +item.entity_id === orgThreeId)!;

      expect(+postOneEvent.result_value).toBe(5);
      expect(+postTwoEvent.result_value).toBe(1);
      expect(+postThreeEvent.result_value).toBe(1);
    });
  });


  describe('Stats delta for organizations', () => {
    let sampleDataSet;
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

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, fieldNameRes, isFloat);
    });

    it('Stats posts delta for orgs', async () => {
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

      await StatsHelper.checkEntitiesCurrentValues(sampleData, ENTITY_NAME, fieldNameInitial, fieldNameRes, isFloat);
    });
  });
});

export {};
