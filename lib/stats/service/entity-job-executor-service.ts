/* eslint-disable no-console */
import { ModelWithEventParamsDto } from '../interfaces/dto-interfaces';
import { EntityEventParamDto, JsonValue } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

import PostsModelProvider = require('../../posts/service/posts-model-provider');
import PostsRepository = require('../../posts/posts-repository');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import OrganizationsRepository = require('../../organizations/repository/organizations-repository');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import TagsRepository = require('../../tags/repository/tags-repository');
import TagsModelProvider = require('../../tags/service/tags-model-provider');
import UsersActivityRepository = require('../../users/repository/users-activity-repository');

const DEFAULT_BATCH_SIZE = 500;

const DEFAULT_WORKER_RECALC_PERIOD = '1h';

interface FetchItem  {
  readonly func: Function;
  readonly entityName: string;
  readonly eventType: number;
}

const fetchSet: FetchItem[] = [
  {
    func: PostsRepository.findManyPostsEntityEvents,
    entityName: PostsModelProvider.getEntityName(),
    eventType: EventParamTypeDictionary.getCurrentBlockchainImportance(),
  },
  {
    func: OrganizationsRepository.findManyOrgsEntityEvents,
    entityName: OrganizationsModelProvider.getEntityName(),
    eventType: EventParamTypeDictionary.getCurrentBlockchainImportance(),
  },
  {
    func: TagsRepository.findManyTagsEntityEvents,
    entityName: TagsModelProvider.getEntityName(),
    eventType: EventParamTypeDictionary.getBackendCalculatedImportance(),
  },
];

export class EntityJobExecutorService {
  public static async processEntityEventParam(
    batchSize: number = DEFAULT_BATCH_SIZE,
  ): Promise<void> {
    for (let i = 0; i < fetchSet.length; i += 1) {
      console.log(`Lets process importance for entity_name: ${fetchSet[i].entityName}`);
      await this.processEntities(fetchSet[i], batchSize);
      console.log('Importance is successfully processed.');
    }

    console.log('Lets process posts votes');
    await this.calculatePostsVotes();
    console.log('Finished');
  }

  private static processAggValue(aggregate, payload) {
    if (!aggregate) {
      return;
    }

    const [activityType, value] = aggregate.split('__');

    if (+activityType === InteractionTypeDictionary.getUpvoteId()) {
      payload.upvotes = +value;
    } else {
      payload.downvotes = +value;
    }
  }

  private static async calculatePostsVotes() {
    const data = await UsersActivityRepository.getPostsVotes();
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    const eventType = EventParamTypeDictionary.getCurrentPostVotes();

    data.forEach((item) => {
      const payload = {
        upvotes: 0,
        downvotes: 0,
      };
      const [aggOne, aggTwo] = item.array_agg;

      this.processAggValue(aggOne, payload);
      this.processAggValue(aggTwo, payload);

      events.push({
        entity_id: +item.entity_id_to,
        entity_name: PostsModelProvider.getEntityName(),
        entity_blockchain_id: 'not-determined-id',
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: this.getParameterJsonData('upvote_downvote', payload),
      });
    });

    await EntityEventRepository.insertManyEvents(events);
  }

  private static async processEntities(
    fetchItem: FetchItem,
    batchSize: number,
  ): Promise<void> {
    let models = await fetchItem.func(batchSize);
    while (models.length > 0) {
      const events = this.getStatsModelFromDbModels(models, fetchItem);
      await EntityEventRepository.insertManyEvents(events);

      if (models.length < batchSize) {
        // in order not to make next request to get empty response
        break;
      }

      const lastId = models[models.length - 1].id;

      models = await fetchItem.func(batchSize, lastId);
    }
  }

  private static getImportanceJsonData(importance: number): JsonValue {
    return {
      worker_recalc_period: DEFAULT_WORKER_RECALC_PERIOD,
      description: 'fetch and save current value',
      data: {
        importance,
      },
    };
  }

  private static getParameterJsonData(
    fieldName: string,
    data: any,
  ): JsonValue {
    return {
      worker_recalc_period: DEFAULT_WORKER_RECALC_PERIOD,
      description: `fetch and save current value of ${fieldName}`,
      data,
    };
  }

  private static getStatsModelFromDbModels(
    dbModels: ModelWithEventParamsDto[],
    fetchItem: FetchItem,
  ): EntityEventParamDto[] {
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    dbModels.forEach((item) => {
      events.push({
        entity_id: item.id,
        entity_name: fetchItem.entityName,
        entity_blockchain_id: item.blockchain_id,
        event_type: fetchItem.eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: this.getImportanceJsonData(item.current_rate),
      });
    });

    return events;
  }
}
