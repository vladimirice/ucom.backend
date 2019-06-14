/* eslint-disable guard-for-in */
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { IdToPropsCollection } from '../../../lib/common/interfaces/common-types';

import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';

import _ = require('lodash');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import ResponseHelper = require('./response-helper');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');
import PostsCurrentParamsRepository = require('../../../lib/posts/repository/posts-current-params-repository');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
import OrgsCurrentParamsRepository = require('../../../lib/organizations/repository/organizations-current-params-repository');
import TagsModelProvider = require('../../../lib/tags/service/tags-model-provider');
import TagsCurrentParamsRepository = require('../../../lib/tags/repository/tags-current-params-repository');
import CommonModelProvider = require('../../../lib/common/service/common-model-provider');
import TotalCurrentParamsRepository = require('../../../lib/stats/repository/total-current-params-repository');

import EntityTotalsCalculator = require('../../../lib/stats/service/entity-totals-calculator');
import TotalDeltaCalculationService = require('../../../lib/stats/service/total-delta-calculation-service');
import CommonChecker = require('../../helpers/common/common-checker');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import UsersCurrentParamsRepository = require('../../../lib/users/repository/users-current-params-repository');

// #task - move to main project part
const expectedJsonValueFields: {[index: number]: string[]} = {
  [EventParamTypeDictionary.getTagItselfCurrentAmounts()]: [
    'current_media_posts_amount',
    'current_direct_posts_amount',
    'current_posts_amount',
    'current_followers_amount',
    'importance',
  ],
  [EventParamTypeDictionary.getUsersPostsTotalAmountDelta()]: [
    'total_delta',
  ],
  [EventParamTypeDictionary.getUsersScaledImportanceDelta()]: [
    'scaled_importance_delta',
  ],
  [EventParamTypeDictionary.getUsersScaledSocialRateDelta()]: [
    'scaled_social_rate_delta',
  ],
  [EventParamTypeDictionary.getOrgPostsTotalAmountDelta()]: [
    'total_delta',
  ],
  [EventParamTypeDictionary.getTagPostsTotalAmountDelta()]: [
    'current_posts_amount_delta',
  ],
  [EventParamTypeDictionary.getTagsActivityIndexDelta()]: [
    'activity_index_delta',
  ],
  [EventParamTypeDictionary.getOrgsActivityIndexDelta()]: [
    'activity_index_delta',
  ],
  [EventParamTypeDictionary.getBlockchainImportanceDelta()]: [
    'importance_delta',
  ],
  [EventParamTypeDictionary.getTagsImportanceDelta()]: [
    'importance_delta',
  ],
  [EventParamTypeDictionary.getPostActivityIndexDelta()]: [
    'activity_index_delta',
  ],
  [EventParamTypeDictionary.getPostUpvotesDelta()]: [
    'upvotes_delta',
  ],
  [EventParamTypeDictionary.getOrgFollowersCurrentAmount()]: [
    'followers',
  ],
  [EventParamTypeDictionary.getOrgPostsCurrentAmount()]: [
    'media_posts',
    'direct_posts',
    'total',
  ],
  [EventParamTypeDictionary.getPostVotesCurrentAmount()]: [
    'upvotes',
    'downvotes',
    'total',
  ],
  [EventParamTypeDictionary.getPostRepostsCurrentAmount()]: [
    'reposts',
  ],
  [EventParamTypeDictionary.getPostCommentsCurrentAmount()]: [
    'comments',
  ],
  [EventParamTypeDictionary.getPostCurrentActivityIndex()]: [
    'activity_index',
    'number_of_comments_with_replies',
    'number_of_reposts',
    'number_of_upvotes',
    'number_of_downvotes',
  ],
  [EventParamTypeDictionary.getOrgCurrentActivityIndex()]: [
    'activity_index',
    'number_of_direct_posts',
    'number_of_media_posts',
    'number_of_followers',
  ],
  [EventParamTypeDictionary.getTagCurrentActivityIndex()]: [
    'activity_index',
    'number_of_direct_posts',
    'number_of_media_posts',
    'number_of_followers',
  ],
  [EventParamTypeDictionary.getCurrentBlockchainImportance()]: [
    'importance',
  ],
};

class StatsHelper {
  public static async checkStatsTotalForOneTypeDynamically(
    eventType: number,
    amount: number,
    description: string,
    recalcInterval: string,
    calculateCurrent: boolean = true,
    calculateDeltas: boolean = false,
  ) {
    const jsonValue: any = {
      description,
      recalc_interval:  recalcInterval,
    };

    const expectedCurrent: any = {
      description,
      event_type: eventType,
      value: amount,
      recalc_interval: recalcInterval,
    };

    if (calculateCurrent) {
      await EntityTotalsCalculator.calculate();
    }

    if (calculateDeltas) {
      await TotalDeltaCalculationService.updateTotalDeltas();
      jsonValue.window_interval       = 'PT24H'; // #task provide separately
      expectedCurrent.window_interval = 'PT24H'; // #task provide separately
    }

    const event: EntityEventParamDto =
      await EntityEventRepository.findOneEventOfTotals(eventType);

    const expected = {
      event_type: eventType,
      result_value: amount,
      json_value: jsonValue,
    };

    StatsHelper.checkOneEventOfTotals(event, expected);
    await StatsHelper.checkTotalsCurrentParams(eventType, expectedCurrent);
  }

  public static async checkEntitiesCurrentValues(
    sampleData: any,
    entityName: string,
    fieldNameInitial: string,
    fieldNameRes: string,
    isFloat: boolean = false,
  ) {
    for (const entityId in sampleData) {
      const expected = sampleData[entityId][fieldNameInitial].delta;

      await this.checkEntityCurrentValue(+entityId, entityName, fieldNameRes, expected, isFloat);
    }
  }

  public static async checkEntityCurrentValue(
    entityId: number,
    entityName: string,
    fieldName: string,
    expectedValue: number,
    isFloat: boolean = false,
  ) {
    const entityNameToRepo = {
      [PostsModelProvider.getEntityName()]:         PostsCurrentParamsRepository,
      [OrganizationsModelProvider.getEntityName()]: OrgsCurrentParamsRepository,
      [TagsModelProvider.getEntityName()]:          TagsCurrentParamsRepository,
      [UsersModelProvider.getEntityName()]:         UsersCurrentParamsRepository,
    };

    if (!entityNameToRepo[entityName]) {
      throw new Error(`Unsupported entity_name: ${entityName}`);
    }

    const repository = entityNameToRepo[entityName];
    const stats = await repository.getCurrentStatsByEntityId(entityId);

    if (isFloat) {
      expect(+stats[fieldName].toFixed(10)).toBe(+expectedValue.toFixed(10));
    } else {
      expect(stats[fieldName]).toBe(expectedValue);
    }
  }

  public static checkManyEventsJsonValuesBySampleData(
    events: EntityEventParamDto[],
    sampleData: any,
    fieldNameInitial: string,
    fieldNameRes: string,
    isFloat: boolean = false,
  ) {
    if (!sampleData) {
      throw new TypeError('Please consider create a sample data properly - it must contain all current params keys');
    }

    const filteredEvents: EntityEventParamDto[] = [];
    for (const event of events) {
      if (sampleData[event.entity_id]) {
        filteredEvents.push(event);
      }
    }

    this.checkManyEventsStructure(filteredEvents);

    const expectedSet: any = {};
    for (const sampleId in sampleData) {
      if (isFloat) {
        expectedSet[sampleId] = {
          [fieldNameRes]: +sampleData[sampleId][fieldNameInitial].delta.toFixed(2),
        };
      } else {
        expectedSet[sampleId] = {
          [fieldNameRes]: sampleData[sampleId][fieldNameInitial].delta,
        };
      }
    }

    if (isFloat) {
      filteredEvents.forEach((event) => {
        event.json_value.data[fieldNameRes] = +event.json_value.data[fieldNameRes].toFixed(2);
      });
    }

    this.checkManyEventsJsonValuesByExpectedSet(filteredEvents, expectedSet);
  }

  public static async checkTotalsCurrentParams(
    eventType: number,
    expectedCurrent,
  ): Promise<any> {
    const actual = await TotalCurrentParamsRepository.findOneByEventType(eventType);

    expect(_.isEmpty(actual)).toBeFalsy();

    expect(_.isEmpty(actual.json_value.created_at)).toBeFalsy();
    expect(typeof actual.json_value.created_at).toBe('string');

    ResponseHelper.expectValuesAreExpected(expectedCurrent, actual.json_value);

    return actual;
  }

  public static checkOneEventOfTotals(actual: EntityEventParamDto, expected: any) {
    expect(_.isEmpty(actual)).toBeFalsy();

    const commonTotalsParams = {
      entity_name: CommonModelProvider.getEntityName(),
      entity_id: CommonModelProvider.getFakeEntityId(),
      entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
      event_group: 0,
      event_super_group: 0,
    };

    const expectedMerged = {
      ...expected,
      ...commonTotalsParams,
    };

    ResponseHelper.expectValuesAreExpected(expectedMerged, actual);
  }

  public static checkManyEventsJsonValuesByExpectedSet(
    events: EntityEventParamDto[],
    expectedSet: IdToPropsCollection,
  ): void {
    CommonChecker.expectNotEmpty(events);
    expect(events.length).toBe(Object.keys(expectedSet).length);

    for (const event of events) {
      const expected = expectedSet[+event.entity_id];
      expect(event.json_value.data).toEqual(expected);
    }
  }

  public static checkManyEventsStructure(events: EntityEventParamDto[]) {
    expect(_.isEmpty(events)).toBeFalsy();

    for (const event of events) {
      this.checkOneEventJsonDataStructure(event);
    }
  }

  public static checkOneEventJsonDataStructure(event: EntityEventParamDto) {
    const { data } = event.json_value;
    const expectedFields = expectedJsonValueFields[event.event_type];

    if (!expectedFields) {
      throw new Error(`Event type must exist: ${event.event_type}`);
    }

    ResponseHelper.expectAllFieldsExistence(data, expectedFields);
  }

  public static getExpectedHardcodedTagsActivityIndexes(
    firstTagId:   number,
    secondTagId:  number,
    thirdTagId:   number,
  ) {
    return {
      [firstTagId]: {
        activity_index: 7.5,

        number_of_direct_posts: 1,
        number_of_media_posts: 2,

        number_of_followers: 0,
      },
      [secondTagId]: {
        activity_index: 3,

        number_of_direct_posts: 0,
        number_of_media_posts: 1,

        number_of_followers: 0,
      },
      [thirdTagId]: {
        activity_index: 1.5,
        number_of_direct_posts: 1,
        number_of_media_posts: 0,

        number_of_followers: 0,
      },
    };
  }

  public static getExpectedHardcodedOrgsActivityIndexes(
    firstOrgId: number,
    secondOrgId: number,
    thirdOrgId: number,
    fourthOrgId: number,
  ) {
    return {
      [firstOrgId]: {
        activity_index: 14,

        number_of_direct_posts: 2,
        number_of_media_posts: 3,

        number_of_followers: 2,
      },
      [secondOrgId]: {
        activity_index: 2.5,

        number_of_direct_posts: 1,
        number_of_media_posts: 0,

        number_of_followers: 1,
      },
      [thirdOrgId]: {
        activity_index: 4,
        number_of_direct_posts: 0,
        number_of_media_posts: 1,

        number_of_followers: 1,
      },
      [fourthOrgId]: {
        activity_index: 1,
        number_of_direct_posts: 0,
        number_of_media_posts: 0,

        number_of_followers: 1,
      },
    };
  }

  public static getExpectedHardcodedPostsActivityIndex(
    firstPostId: number,
    secondPostId: number,
    thirdPostId: number,
    fourthPostId: number,
    fifthPostId: number,
  ) {
    return {
      [firstPostId]: {
        activity_index: 16.5,
        number_of_comments_with_replies: 4,
        number_of_reposts: 1,
        number_of_upvotes: 3,
        number_of_downvotes: 0,
      },
      [secondPostId]: {
        activity_index: 9,
        number_of_comments_with_replies: 1,
        number_of_reposts: 2,
        number_of_upvotes: 2,
        number_of_downvotes: 1,
      },
      [thirdPostId]: {
        activity_index: 3,
        number_of_comments_with_replies: 0,
        number_of_reposts: 0,
        number_of_upvotes: 0,
        number_of_downvotes: 3,
      },
      [fourthPostId]: {
        activity_index: 1.5,
        number_of_comments_with_replies: 0,
        number_of_reposts: 1,
        number_of_upvotes: 0,
        number_of_downvotes: 0,
      },
      [fifthPostId]: {
        activity_index: 12,
        number_of_comments_with_replies: 4,
        number_of_reposts: 0,
        number_of_upvotes: 0,
        number_of_downvotes: 0,
      },
    };
  }
}

export = StatsHelper;
