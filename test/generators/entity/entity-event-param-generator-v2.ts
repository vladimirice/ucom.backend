import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';

import JsonValueService = require('../../../lib/stats/service/json-value-service');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import EventParamGroupDictionary = require('../../../lib/stats/dictionary/event-param/event-param-group-dictionary');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');

const moment = require('moment');

const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined';

class EntityEventParamGeneratorV2 {
  public static async createEventsAndGetSampleDataSet(
    firstPostId: number,
    secondPostId: number,
  ): Promise<any> {
    const createdAtSet = {
      before: '2018-11-21 00:00:00.999275',
      after: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    };

    const sampleData = {
      [firstPostId]: {
        importance: {
          before: 7.721208926,
          after: 10.211208926,
          delta: 10.211208926 - 7.721208926,
        },
        createdAt: createdAtSet,
      },
      [secondPostId]: {
        importance: {
          before: 4.721208926,
          after: 2.211208926,
          delta: 2.211208926 - 4.721208926,
        },
        createdAt: createdAtSet,
      },
    };

    await EntityEventParamGeneratorV2.createImportanceEventsByPostsData(
      sampleData,
      PostsModelProvider.getEntityName(),
    );

    return sampleData;

    // return [
    //   // disturbance
    //   {
    //     blockchain_id: 'sample_anything', // this structure is generated inside mock function
    //     entity_name: 'org       ',
    //     event_type: 1,
    //     importance: {
    //       before: 4.721208926,
    //       after: 2.211208926,
    //     },
    //     created_at: createdAtSet,
    //   },
    //
    //   // disturbance
    //   {
    //     blockchain_id: 'other_sample_anything',
    //     // this structure is generated inside mock function
    //     entity_name: 'users     ',
    //     event_type: 10,
    //     importance: {
    //       before: 4.721208926,
    //       after: 2.211208926,
    //     },
    //     created_at: createdAtSet,
    //   },
    // ];
  }

  public static async createEventsAndGetSampleDataSetForFirstOnlyAfter(
    firstPostId: number,
    secondPostId: number,
  ): Promise<any> {
    const createdAtSet = {
      before: '2018-11-21 00:00:00.999275',
      after: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    };

    const sampleData = {
      [firstPostId]: {
        importance: {
          after: 10.211208926,
          delta: 10.211208926,
        },
        createdAt: createdAtSet,
      },
      [secondPostId]: {
        importance: {
          before: 4.721208926,
          after: 2.211208926,
          delta: 2.211208926 - 4.721208926,
        },
        createdAt: createdAtSet,
      },
    };

    await EntityEventParamGeneratorV2.createImportanceEventsByPostsData(
      sampleData,
      PostsModelProvider.getEntityName(),
    );

    return sampleData;
  }

  public static async createPostUpvotesEventsAndGetSampleData(
    firstPostId: number,
    secondPostId: number,
  ): Promise<any> {
    const createdAtSet = {
      before: '2018-11-21 00:00:00.999275',
      after: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    };

    const sampleData = {
      [firstPostId]: {
        upvotes: {
          before: 0,
          after: 20,
          delta: 20,
        },
        downvotes: {
          before: 1,
          after: 5,
          delta: 4,
        },
        total: {
          before: 1,
          after: 25,
          delta: 24,
        },
        createdAt: createdAtSet,
      },
      [secondPostId]: {
        upvotes: {
          before: 4,
          after: 10,
          delta: 6,
        },
        downvotes: {
          before: 3,
          after: 6,
          delta: 3,
        },
        total: {
          before: 7,
          after: 14,
          delta: 7,
        },
        createdAt: createdAtSet,
      },
    };

    await EntityEventParamGeneratorV2.createUpvoteEventsByPostsData(
      sampleData,
      PostsModelProvider.getEntityName(),
    );

    return sampleData;
  }

  public static async createPostActivityIndexEventsAndGetSampleData(
    firstPostId: number,
    secondPostId: number,
  ): Promise<any> {
    const createdAtSet = {
      before: '2018-11-21 00:00:00.999275',
      after: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    };

    const sampleData = {
      [firstPostId]: {
        activity_index: {
          before: 3,
          after: 1.5,
          delta: -1.5,
        },
        createdAt: createdAtSet,
      },
      [secondPostId]: {
        activity_index: {
          before: 8.5,
          after: 16.25,
          delta: 7.75,
        },
        createdAt: createdAtSet,
      },
    };

    await EntityEventParamGeneratorV2.createActivityIndexEventsByPostsData(
      sampleData,
      PostsModelProvider.getEntityName(),
    );

    return sampleData;
  }

  public static async createEventsAndGetSampleDataSetForSecondOnlyBefore(
    firstPostId: number,
    secondPostId: number,
  ) {
    const createdAtSet = {
      before: '2018-11-21 00:00:00.999275',
      after: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    };

    const sampleData = {
      [firstPostId]: {
        importance: {
          before: 4.721208926,
          after: 2.211208926,
          delta: 2.211208926 - 4.721208926,
        },
        createdAt: createdAtSet,
      },
      [secondPostId]: {
        importance: {
          before: 10.211208926,
          delta: 0,
        },
        createdAt: createdAtSet,
      },
    };

    await EntityEventParamGeneratorV2.createImportanceEventsByPostsData(
      sampleData,
      PostsModelProvider.getEntityName(),
    );

    return sampleData;
  }

  private static async createImportanceEventsByPostsData(entitiesData, entityName) {
    for (const entityId in entitiesData) {
      if (!entitiesData.hasOwnProperty(entityId)) {
        continue;
      }

      const data = entitiesData[entityId];

      const events: EntityEventParamDto[] = [];

      if (data.importance.before) {
        events.push({
          entity_id: +entityId,
          entity_name: entityName,
          entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
          event_type: EventParamTypeDictionary.getCurrentBlockchainImportance(),
          event_group: EventParamGroupDictionary.getNotDetermined(),
          event_super_group: EventParamGroupDictionary.getNotDetermined(),
          json_value: JsonValueService.getJsonValueParameter('sample description', {
            importance: entitiesData[entityId].importance.before,
          }),
          result_value: entitiesData[entityId].importance.before,
          created_at: entitiesData[entityId].createdAt.before,
        });
      }

      if (data.importance.after) {
        events.push({
          entity_id: +entityId,
          entity_name: entityName,
          entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
          event_type: EventParamTypeDictionary.getCurrentBlockchainImportance(),
          event_group: EventParamGroupDictionary.getNotDetermined(),
          event_super_group: EventParamGroupDictionary.getNotDetermined(),
          json_value: JsonValueService.getJsonValueParameter('sample description', {
            importance: entitiesData[entityId].importance.after,
          }),
          result_value: entitiesData[entityId].importance.after,
          created_at: entitiesData[entityId].createdAt.after,
        });
      }

      await EntityEventRepository.insertManyEvents(events);
    }
  }

  private static async createUpvoteEventsByPostsData(entitiesData, entityName) {
    for (const entityId in entitiesData) {
      if (!entitiesData.hasOwnProperty(entityId)) {
        continue;
      }

      const data = entitiesData[entityId];

      const events: EntityEventParamDto[] = [];

      if (data.upvotes.before) {
        events.push({
          entity_id: +entityId,
          entity_name: entityName,
          entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
          event_type: EventParamTypeDictionary.getPostVotesCurrentAmount(),
          event_group: EventParamGroupDictionary.getNotDetermined(),
          event_super_group: EventParamGroupDictionary.getNotDetermined(),
          json_value: JsonValueService.getJsonValueParameter('sample description', {
            upvotes: entitiesData[entityId].upvotes.before,
            downvotes: entitiesData[entityId].downvotes.before,
            total: entitiesData[entityId].total.before,
          }),
          result_value: entitiesData[entityId].total.before,
          created_at: entitiesData[entityId].createdAt.before,
        });
      }

      if (data.upvotes.after) {
        events.push({
          entity_id: +entityId,
          entity_name: entityName,
          entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
          event_type: EventParamTypeDictionary.getPostVotesCurrentAmount(),
          event_group: EventParamGroupDictionary.getNotDetermined(),
          event_super_group: EventParamGroupDictionary.getNotDetermined(),
          json_value: JsonValueService.getJsonValueParameter('sample description', {
            upvotes: entitiesData[entityId].upvotes.after,
            downvotes: entitiesData[entityId].downvotes.after,
            total: entitiesData[entityId].total.after,
          }),
          result_value: entitiesData[entityId].total.after,
          created_at: entitiesData[entityId].createdAt.after,
        });
      }

      await EntityEventRepository.insertManyEvents(events);
    }
  }

  private static async createActivityIndexEventsByPostsData(entitiesData, entityName) {
    for (const entityId in entitiesData) {
      if (!entitiesData.hasOwnProperty(entityId)) {
        continue;
      }

      const data = entitiesData[entityId];

      const events: EntityEventParamDto[] = [];

      if (data.activity_index.before) {
        events.push({
          entity_id: +entityId,
          entity_name: entityName,
          entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
          event_type: EventParamTypeDictionary.getPostCurrentActivityIndex(),
          event_group: EventParamGroupDictionary.getNotDetermined(),
          event_super_group: EventParamGroupDictionary.getNotDetermined(),
          json_value: JsonValueService.getJsonValueParameter('sample description', {
            activity_index: entitiesData[entityId].activity_index.before,
          }),
          result_value: entitiesData[entityId].activity_index.before,
          created_at: entitiesData[entityId].createdAt.before,
        });
      }

      if (data.activity_index.after) {
        events.push({
          entity_id: +entityId,
          entity_name: entityName,
          entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
          event_type: EventParamTypeDictionary.getPostCurrentActivityIndex(),
          event_group: EventParamGroupDictionary.getNotDetermined(),
          event_super_group: EventParamGroupDictionary.getNotDetermined(),
          json_value: JsonValueService.getJsonValueParameter('sample description', {
            activity_index: entitiesData[entityId].activity_index.after,
          }),
          result_value: entitiesData[entityId].activity_index.after,
          created_at: entitiesData[entityId].createdAt.after,
        });
      }

      await EntityEventRepository.insertManyEvents(events);
    }
  }
}

export = EntityEventParamGeneratorV2;
