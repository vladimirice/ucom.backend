/* eslint-disable no-console */
import { ModelWithEventParamsDto } from '../interfaces/dto-interfaces';
import { EntityEventParamDto } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';


import PostsModelProvider = require('../../posts/service/posts-model-provider');
import PostsRepository = require('../../posts/posts-repository');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import OrganizationsRepository = require('../../organizations/repository/organizations-repository');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import PostsStatsJob = require('../job/posts-stats-job');
import JsonValueService = require('./json-value-service');
import OrgStatsJob = require('../job/org-stats-job');
import TagsStatsJob = require('../job/tags-stats-job');
import NumbersHelper = require('../../common/helper/numbers-helper');
import UsersStatsJob = require('../job/users-stats-job');

const DEFAULT_BATCH_SIZE = 500;

interface FetchItem  {
  readonly func: Function;
  readonly entityName: string;
  readonly eventType: number;
}

const fetchSet: FetchItem[] = [
  {
    func:       PostsRepository.findManyPostsEntityEvents,
    entityName: PostsModelProvider.getEntityName(),
    eventType:  EventParamTypeDictionary.getCurrentBlockchainImportance(),
  },
  {
    func:       OrganizationsRepository.findManyOrgsEntityEvents,
    entityName: OrganizationsModelProvider.getEntityName(),
    eventType:  EventParamTypeDictionary.getCurrentBlockchainImportance(),
  },
];

export class EntityJobExecutorService {
  public static async processEntityEventParam(
    batchSize: number = DEFAULT_BATCH_SIZE,
  ): Promise<void> {
    for (const set of fetchSet) {
      console.log(`Lets process importance for entity_name: ${set.entityName}`);
      await this.processEntitiesImportance(set, batchSize);
      console.log('Importance is successfully processed.');
    }
    console.log('Lets process current values');
    await PostsStatsJob.processPostsCurrentValues();
    await OrgStatsJob.processCurrentValues();
    await TagsStatsJob.processCurrentValues(batchSize);
    await UsersStatsJob.processCurrentValues(batchSize);
  }

  private static async processEntitiesImportance(
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


  private static getStatsModelFromDbModels(
    dbModels: ModelWithEventParamsDto[],
    fetchItem: FetchItem,
  ): EntityEventParamDto[] {
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    for (const item of dbModels) {
      const payload = {
        importance: NumbersHelper.processFloatModelProperty(item.current_rate, 'current_rate'),
      };

      events.push({
        entity_id:            item.id,
        entity_blockchain_id: item.blockchain_id,
        result_value:         payload.importance,

        entity_name:          fetchItem.entityName,
        event_type:           fetchItem.eventType,

        event_group:          eventGroup,
        event_super_group:    eventSuperGroup,
        json_value:           JsonValueService.getJsonValueParameter('importance', payload),
      });
    }

    return events;
  }
}
