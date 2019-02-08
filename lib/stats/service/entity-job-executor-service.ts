import knexEvents = require('../../../config/knex-events');

import PostsModelProvider = require('../../posts/service/posts-model-provider');
import knex = require('../../../config/knex');

const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';

interface EntityEventParamDto {
  entity_id: number;
  entity_name: string;
  entity_blockchain_id: string;
  event_type: number;
  event_group: number;
  json_value: any;
}

interface ModelWithRateDto {
  id: number;
  blockchain_id: string;
  current_rate: number;
}

export class EntityJobExecutorService {
  private static getImportanceJsonData(data: number) {
    return {
      importance: data,
    };
  }

  private static getStatsModelFromDbModels(dbModels: ModelWithRateDto[]): EntityEventParamDto[] {
    const events: EntityEventParamDto[] = [];

    // TODO
    const EVENT_TYPE = 1;
    // TODO
    const EVENT_GROUP = 1;

    dbModels.forEach((item) => {
      events.push({
        entity_id: item.id,
        entity_name: PostsModelProvider.getEntityName(),
        entity_blockchain_id: item.blockchain_id,
        event_type: EVENT_TYPE,
        event_group: EVENT_GROUP,
        json_value: this.getImportanceJsonData(item.current_rate),
      });
    });

    return events;
  }

  private static async getPostsWithRates(): Promise<ModelWithRateDto[]> {
    // TODO - batch
    return knex('posts')
      .select([
        'id',
        'blockchain_id',
        'current_rate',
      ]);
  }

  public static async processEntityEventParam(): Promise<void> {
    const data = await this.getPostsWithRates();

    const events = this.getStatsModelFromDbModels(data);
    // Fetch one posts current rate and write it like importance worker does

    await knexEvents(ENTITY_EVENT_TABLE_NAME).insert(events);
  }
}
