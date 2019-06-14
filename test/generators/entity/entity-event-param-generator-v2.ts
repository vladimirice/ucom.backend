/* eslint-disable guard-for-in */
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { StatsEventsOptions } from '../../interfaces/options-interfaces';

import JsonValueService = require('../../../lib/stats/service/json-value-service');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import EventParamGroupDictionary = require('../../../lib/stats/dictionary/event-param/event-param-group-dictionary');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');
import RequestHelper = require('../../integration/helpers/request-helper');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
import TagsModelProvider = require('../../../lib/tags/service/tags-model-provider');
import OrganizationsGenerator = require('../organizations-generator');
import UsersHelper = require('../../integration/helpers/users-helper');
import EntityTagsGenerator = require('./entity-tags-generator');
import PostsGenerator = require('../posts-generator');
import EntityCalculationService = require('../../../lib/stats/service/entity-calculation-service');
import CommonModelProvider = require('../../../lib/common/service/common-model-provider');
import UsersModelProvider = require('../../../lib/users/users-model-provider');


const { ParamTypes } = require('ucom.libs.common').Stats.Dictionary;

const moment = require('moment');

const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined';

let userVlad;
let userJane;
let userPetr;
let userRokky;

class EntityEventParamGeneratorV2 {
  public static async createAndProcessManyEventsForManyEntities(): Promise<void> {
    // #task - try to use Promise.all
    await EntityEventParamGeneratorV2.createManyEventsForRandomPostIds();
    await EntityEventParamGeneratorV2.createManyEventsForRandomOrgsIds();
    await EntityEventParamGeneratorV2.createManyEventsForRandomTagsIds();

    await EntityCalculationService.updateEntitiesDeltas();
  }

  public static async createManyEventsForRandomPostIds(): Promise<void> {
    await this.fetchUsers();

    const [firstPostId, secondPostId] = await Promise.all([
      PostsGenerator.createMediaPostByUserHimself(userPetr),
      PostsGenerator.createMediaPostByUserHimself(userRokky),
    ]);

    const options: StatsEventsOptions = {
      posts: {
        importance:     true,
        upvotes:        true,
        activityIndex:  true,
      },
    };

    return EntityEventParamGeneratorV2.createDifferentEventsForPosts(
      firstPostId,
      secondPostId,
      options,
    );
  }

  public static async createManyEventsForRandomOrgsIds(): Promise<any> {
    await this.fetchUsers();

    const [firstId, secondId] = await Promise.all([
      OrganizationsGenerator.createOrgWithoutTeam(userVlad),
      OrganizationsGenerator.createOrgWithoutTeam(userJane),
    ]);

    const options = {
      importance:       true,
      postsTotalDelta:  true,
      activityIndex:    true,
    };

    return EntityEventParamGeneratorV2.createDifferentEventsForOrgs(
      firstId,
      secondId,
      options,
    );
  }

  public static async createManyEventsForUsers(): Promise<any> {
    await this.fetchUsers();
    const entityName = UsersModelProvider.getEntityName();

    const sampleData: any = {};

    const eventTypeInitial  = EventParamTypeDictionary.getUsersPostsCurrentAmount();

    const fieldNameInitial  = 'total';
    sampleData[fieldNameInitial] = await EntityEventParamGeneratorV2.createEventsAndGetExpectedDataSet(
      userVlad.id,
      userJane.id,
      entityName,
      eventTypeInitial,
      fieldNameInitial,
      false,
    );

    const sample = await this.createUosAccountsCurrentEventsAndGetExpectedDataSet(
      userVlad.id,
      userJane.id,
      entityName,
      EventParamTypeDictionary.getUserHimselfCurrentAmounts(),
    );

    sampleData.scaled_importance = sample;
    sampleData.scaled_social_rate = sample;

    return sampleData;
  }

  public static async createManyEventsForRandomTagsIds(): Promise<any> {
    await this.fetchUsers();

    const titleToId = await EntityTagsGenerator.createManyTagsViaNewPostAndGetTagsIds(
      userVlad,
      ['summer', 'winter'],
    );

    const ids = Object.values(titleToId);

    return this.createDifferentEventsForTags(ids[0], ids[1]);
  }

  public static async createDifferentEventsForPosts(
    firstPostId: number,
    secondPostId: number,
    options: StatsEventsOptions,
  ) {
    const postsOptions = options.posts!;

    const entityName = PostsModelProvider.getEntityName();

    const sampleData: any = {};

    if (postsOptions.importance) {
      const fieldName: string = 'importance';

      sampleData[fieldName] = await EntityEventParamGeneratorV2.createEventsAndGetExpectedDataSet(
        firstPostId,
        secondPostId,
        entityName,
        EventParamTypeDictionary.getCurrentBlockchainImportance(),
        fieldName,
      );
    }

    if (postsOptions.upvotes) {
      sampleData.upvotes = await EntityEventParamGeneratorV2.createPostUpvotesEventsAndGetSampleData(
        firstPostId,
        secondPostId,
      );
    }

    if (postsOptions.activityIndex) {
      sampleData.activity_index = await EntityEventParamGeneratorV2.createPostActivityIndexEventsAndGetSampleData(
        firstPostId,
        secondPostId,
      );
    }

    return sampleData;
  }

  private static async createDifferentEventsForOrgs(
    firstEntityId: number,
    secondEntityId: number,
    options: any,
  ) {
    const entityName = OrganizationsModelProvider.getEntityName();

    const sampleData: any = {};

    if (options.importance) {
      const eventType = EventParamTypeDictionary.getCurrentBlockchainImportance();
      const fieldName: string = 'importance';

      sampleData[fieldName] = await EntityEventParamGeneratorV2.createEventsAndGetExpectedDataSet(
        firstEntityId,
        secondEntityId,
        entityName,
        eventType,
        fieldName,
      );
    }

    if (options.postsTotalDelta) {
      const eventTypeInitial  = EventParamTypeDictionary.getOrgPostsCurrentAmount();

      const fieldNameInitial  = 'total';
      sampleData[fieldNameInitial] = await EntityEventParamGeneratorV2.createEventsAndGetExpectedDataSet(
        firstEntityId,
        secondEntityId,
        entityName,
        eventTypeInitial,
        fieldNameInitial,
        false,
      );
    }

    if (options.activityIndex) {
      const eventTypeInitial  = EventParamTypeDictionary.getOrgCurrentActivityIndex();

      const fieldNameInitial  = 'activity_index';
      const isFloat           = true;

      sampleData[fieldNameInitial] = await EntityEventParamGeneratorV2.createEventsAndGetExpectedDataSet(
        firstEntityId,
        secondEntityId,
        entityName,
        eventTypeInitial,
        fieldNameInitial,
        isFloat,
      );
    }

    return sampleData;
  }

  private static async createDifferentEventsForTags(
    firstEntityId: number,
    secondEntityId: number,
  ) {
    const entityName = TagsModelProvider.getEntityName();
    const tagItselfEventType = EventParamTypeDictionary.getTagItselfCurrentAmounts();
    const sampleData: any = {};

    const tagItselfSampleData = await this.createTagItselfCurrentEventsAndGetExpectedDataSet(
      firstEntityId,
      secondEntityId,
      entityName,
      tagItselfEventType,
    );

    sampleData.importance           = tagItselfSampleData;
    sampleData.current_posts_amount = tagItselfSampleData;

    const eventTypeInitial  = EventParamTypeDictionary.getTagCurrentActivityIndex();

    const fieldNameInitial  = 'activity_index';
    const isFloat           = true;

    sampleData[fieldNameInitial] = await EntityEventParamGeneratorV2.createEventsAndGetExpectedDataSet(
      firstEntityId,
      secondEntityId,
      entityName,
      eventTypeInitial,
      fieldNameInitial,
      isFloat,
    );

    return sampleData;
  }

  public static async createEventsAndGetExpectedDataSet(
    firstEntityId: number,
    secondEntityId: number,
    entityName: string,
    eventType: number,
    fieldName: string,
    isFloat: boolean = true,
  ): Promise<any> {
    const floatPrecision = isFloat ? 10 : 0;

    const positiveDeltaSet  = this.getBeforeAfterDeltaSet(floatPrecision, true);
    const negativeDeltaSet  = this.getBeforeAfterDeltaSet(floatPrecision, false);

    const sampleData = {
      [firstEntityId]: {
        [fieldName]: positiveDeltaSet,
        jsonData: {
          before: {
            [fieldName]: positiveDeltaSet.before,
          },
          after: {
            [fieldName]: positiveDeltaSet.after,
          },
        },
      },
      [secondEntityId]: {
        [fieldName]: negativeDeltaSet,
        jsonData: {
          before: {
            [fieldName]: negativeDeltaSet.before,
          },
          after: {
            [fieldName]: negativeDeltaSet.after,
          },
        },
      },
    };

    await EntityEventParamGeneratorV2.createEventsEntitiesData(
      sampleData,
      entityName,
      eventType,
    );

    return sampleData;
  }

  public static async createAllTotalEvents(): Promise<any> {
    const isFloat = false;
    const sampleData: any = {};
    for (const eventType of ParamTypes.ALL_NUMBERS) {
      sampleData[eventType] = await this.createTotalEventsAndGetExpectedDataSet(eventType, isFloat);
    }

    return sampleData;
  }

  public static async createTotalEventsAndGetExpectedDataSet(
    eventType: number,
    isFloat: boolean = true,
  ): Promise<any> {
    const floatPrecision = isFloat ? 10 : 0;

    const positiveDeltaSet  = this.getBeforeAfterDeltaSet(floatPrecision, true);

    await EntityEventParamGeneratorV2.createTotalEventsEntitiesData(
      positiveDeltaSet,
      eventType,
    );

    return positiveDeltaSet;
  }

  public static async createTagItselfCurrentEventsAndGetExpectedDataSet(
    firstEntityId: number,
    secondEntityId: number,
    entityName: string,
    eventType: number,
  ): Promise<any> {
    const firstIdImportanceSet  = this.getBeforeAfterDeltaSet(10, true);
    const secondIdImportanceSet = this.getBeforeAfterDeltaSet(10, false);

    const firstIdPostsTotalAmountSet  = this.getBeforeAfterDeltaSet(0, true);
    const secondIdPostsTotalAmountSet = this.getBeforeAfterDeltaSet(0, true);

    const sampleData = {
      [firstEntityId]: {
        importance: firstIdImportanceSet,
        current_posts_amount: firstIdPostsTotalAmountSet,
        jsonData: {
          before: {
            importance:           firstIdImportanceSet.before,
            current_posts_amount: firstIdPostsTotalAmountSet.before,
          },
          after: {
            importance:           firstIdImportanceSet.after,
            current_posts_amount: firstIdPostsTotalAmountSet.after,
          },
        },
      },
      [secondEntityId]: {
        importance: secondIdImportanceSet,
        current_posts_amount: secondIdPostsTotalAmountSet,
        jsonData: {
          before: {
            importance:           secondIdImportanceSet.before,
            current_posts_amount: secondIdPostsTotalAmountSet.before,
          },
          after: {
            importance:           secondIdImportanceSet.after,
            current_posts_amount: secondIdPostsTotalAmountSet.after,
          },
        },
      },
    };

    await EntityEventParamGeneratorV2.createEventsEntitiesData(
      sampleData,
      entityName,
      eventType,
    );

    return sampleData;
  }

  public static async createUosAccountsCurrentEventsAndGetExpectedDataSet(
    firstEntityId: number,
    secondEntityId: number,
    entityName: string,
    eventType: number,
  ): Promise<any> {
    const firstIdImportanceSet          = this.getBeforeAfterDeltaSet(10, true);
    const firstIdImportanceSetPartTwo   = this.getBeforeAfterDeltaSet(10, true);
    const secondIdImportanceSet         = this.getBeforeAfterDeltaSet(10, false);
    const secondIdImportanceSetPartTwo  = this.getBeforeAfterDeltaSet(10, false);

    const sampleData = {
      [firstEntityId]: {
        scaled_importance: firstIdImportanceSet,
        scaled_social_rate: firstIdImportanceSetPartTwo,
        jsonData: {
          before: {
            scaled_importance:  firstIdImportanceSet.before,
            scaled_social_rate:  firstIdImportanceSetPartTwo.before,
          },
          after: {
            scaled_importance:  firstIdImportanceSet.after,
            scaled_social_rate : firstIdImportanceSetPartTwo.after,
          },
        },
      },
      [secondEntityId]: {
        scaled_importance: secondIdImportanceSet,
        scaled_social_rate: secondIdImportanceSetPartTwo,
        jsonData: {
          before: {
            scaled_importance:           secondIdImportanceSet.before,
            scaled_social_rate:          secondIdImportanceSetPartTwo.before,
          },
          after: {
            scaled_importance:           secondIdImportanceSet.after,
            scaled_social_rate:          secondIdImportanceSetPartTwo.after,
          },
        },
      },
    };

    await EntityEventParamGeneratorV2.createEventsEntitiesData(
      sampleData,
      entityName,
      eventType,
    );

    return sampleData;
  }

  public static async createEventsAndGetSampleDataSetForFirstOnlyAfter(
    firstPostId: number,
    secondPostId: number,
  ): Promise<any> {
    const createdAtSet = this.getCreatedAtSet();
    const eventType = EventParamTypeDictionary.getCurrentBlockchainImportance();

    const negativeDeltaSet  = this.getBeforeAfterDeltaSet(10, false);

    const sampleData = {
      [firstPostId]: {
        importance: {
          after: 10.211208926,
          delta: 10.211208926,
        },
        jsonData: {
          after: {
            importance: 10.211208926,
          },
        },
        createdAt: createdAtSet,
      },
      [secondPostId]: {
        importance: negativeDeltaSet,
        jsonData: {
          before: {
            importance: negativeDeltaSet.before,
          },
          after: {
            importance: negativeDeltaSet.after,
          },
        },
        createdAt: createdAtSet,
      },
    };

    await EntityEventParamGeneratorV2.createEventsEntitiesData(
      sampleData,
      PostsModelProvider.getEntityName(),
      eventType,
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
    const eventType = EventParamTypeDictionary.getCurrentBlockchainImportance();

    const negativeDeltaSet  = this.getBeforeAfterDeltaSet(10, false);

    const sampleData = {
      [firstPostId]: {
        importance: negativeDeltaSet,
        jsonData: {
          before: {
            importance: negativeDeltaSet.before,
          },
          after: {
            importance: negativeDeltaSet.after,
          },
        },
      },
      [secondPostId]: {
        jsonData: {
          before: {
            importance: 10.211208926,
          },
        },
        importance: {
          before: 10.211208926,
          delta: 0,
        },
      },
    };

    await EntityEventParamGeneratorV2.createEventsEntitiesData(
      sampleData,
      PostsModelProvider.getEntityName(),
      eventType,
    );

    return sampleData;
  }

  private static async createEventsEntitiesData(
    entitiesData: any,
    entityName: string,
    eventType: number,
  ) {
    for (const entityId in entitiesData) {
      if (!entitiesData.hasOwnProperty(entityId)) {
        continue;
      }

      const data = entitiesData[entityId];

      const events: EntityEventParamDto[] = [];

      const createdAtSet = this.getCreatedAtSet();

      if (data.jsonData.before) {
        events.push({
          entity_id:    +entityId,
          entity_name:  entityName,
          event_type:   eventType,
          json_value:   JsonValueService.getJsonValueParameter('sample description', data.jsonData.before),
          created_at:   createdAtSet.before,

          result_value: 0,
          entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
          event_group:          EventParamGroupDictionary.getNotDetermined(),
          event_super_group:    EventParamGroupDictionary.getNotDetermined(),
        });
      }

      if (data.jsonData.after) {
        events.push({
          entity_id:    +entityId,
          entity_name:  entityName,
          event_type:   eventType,
          json_value:   JsonValueService.getJsonValueParameter('sample description', data.jsonData.after),
          created_at:   createdAtSet.after,

          result_value: 0,
          entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
          event_group:          EventParamGroupDictionary.getNotDetermined(),
          event_super_group:    EventParamGroupDictionary.getNotDetermined(),
        });
      }

      await EntityEventRepository.insertManyEvents(events);
    }
  }

  private static async createTotalEventsEntitiesData(
    positiveDeltaSet: any,
    eventType: number,
  ) {
    const entityId      = CommonModelProvider.getFakeEntityId();
    const entityName    = CommonModelProvider.getEntityName();
    const blockchainId  = CommonModelProvider.getFakeBlockchainId();

    const events: EntityEventParamDto[] = [];

    const createdAtSet = this.getCreatedAtSet();

    if (positiveDeltaSet.before) {
      events.push({
        entity_id:    +entityId,
        entity_name:  entityName,
        event_type:   eventType,
        // @ts-ignore
        json_value:   {},
        created_at:   createdAtSet.before,

        result_value:         positiveDeltaSet.before,

        entity_blockchain_id: blockchainId,

        event_group:          EventParamGroupDictionary.getNotDetermined(),
        event_super_group:    EventParamGroupDictionary.getNotDetermined(),
      });
    }

    if (positiveDeltaSet.after) {
      events.push({
        entity_id:    +entityId,
        entity_name:  entityName,
        event_type:   eventType,
        // @ts-ignore
        json_value:   {},
        created_at:   createdAtSet.after,

        result_value:         positiveDeltaSet.after,

        entity_blockchain_id: blockchainId,

        event_group:          EventParamGroupDictionary.getNotDetermined(),
        event_super_group:    EventParamGroupDictionary.getNotDetermined(),
      });
    }

    await EntityEventRepository.insertManyEvents(events);
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

  private static getBeforeAfterDeltaSet(
    floatPrecision: number,
    isDeltaPositive: boolean,
    min: number = 1,
    max: number = 20,
  ): { before: number, after: number, delta: number } {
    const data = {
      before: 0,
      after: 0,
      delta: 0,
    };

    data.before = RequestHelper.generateRandomNumber(min, max, floatPrecision);

    const mutator = RequestHelper.generateRandomNumber(1, 5, floatPrecision);

    if (isDeltaPositive) {
      data.after = data.before + mutator;
    } else {
      data.after = data.before - mutator;
    }

    data.delta = data.after - data.before;

    return data;
  }

  private static getCreatedAtSet(): { before: string, after: string } {
    return {
      before: '2018-11-21 00:00:00.999275',
      after: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    };
  }

  private static async fetchUsers() {
    [userVlad, userJane, userPetr, userRokky] = await Promise.all([
      UsersHelper.getUserVlad(),
      UsersHelper.getUserJane(),
      UsersHelper.getUserPetr(),
      UsersHelper.getUserRokky(),
    ]);
  }
}

export = EntityEventParamGeneratorV2;
