import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { IdToPropsCollection } from '../../../lib/common/interfaces/common-types';

import _ = require('lodash');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import ResponseHelper = require('./response-helper');

const expectedJsonValueFields: {[index: number]: string[]} = {
  [EventParamTypeDictionary.getTagItselfCurrentAmounts()]: [
    'current_media_posts_amount',
    'current_direct_posts_amount',
    'current_posts_amount',
    'current_followers_amount',
    'importance',
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
  public static checkManyEventsJsonValuesByExpectedSet(
    events: EntityEventParamDto[],
    expectedSet: IdToPropsCollection,
  ): void {
    expect(_.isEmpty(events)).toBeFalsy();
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
