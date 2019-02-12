import { EntityEventParamDto } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';
import { TagWithEventParamsDto } from '../../tags/interfaces/dto-interfaces';

import TagsRepository = require('../../tags/repository/tags-repository');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import TagsModelProvider = require('../../tags/service/tags-model-provider');
import JsonValueService = require('../service/json-value-service');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');

const ENTITY_NAME = TagsModelProvider.getEntityName();

class TagsStatsJob {
  public static async processCurrentValues(batchSize: number): Promise<void> {
    await this.calculateTagItselfCurrentValues(batchSize);
  }

  private static async calculateTagItselfCurrentValues(
    batchSize: number,
  ): Promise<void> {
    let models: TagWithEventParamsDto[] = await TagsRepository.findManyTagsEntityEvents(batchSize);
    while (models.length > 0) {
      const events = this.getStatsModelFromDbModels(models);
      await EntityEventRepository.insertManyEvents(events);

      if (models.length < batchSize) {
        // in order not to make next request to get empty response
        break;
      }

      const lastId = models[models.length - 1].id;

      models = await TagsRepository.findManyTagsEntityEvents(batchSize, lastId);
    }
  }

  private static getStatsModelFromDbModels(
    dbModels: TagWithEventParamsDto[],
  ): EntityEventParamDto[] {
    const events: EntityEventParamDto[] = [];

    const eventType       = EventParamTypeDictionary.getTagItselfCurrentAmounts();
    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    dbModels.forEach((item) => {
      const payload = {
        current_posts_amount: item.current_posts_amount,
        current_media_posts_amount: item.current_media_posts_amount,
        current_direct_posts_amount: item.current_direct_posts_amount,
        importance: +item.current_rate,
      };

      events.push({
        entity_id: item.id,
        entity_name: ENTITY_NAME,
        entity_blockchain_id: item.blockchain_id,
        event_type: eventType,
        event_group: eventGroup,
        result_value: 0,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter('tag itself current amounts', payload),
      });
    });

    return events;
  }
}

export = TagsStatsJob;
