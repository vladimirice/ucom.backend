
import knexEvents = require('../../../config/knex-events');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import PostsModelProvider = require('../../posts/service/posts-model-provider');

const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';

interface EntityEventParam {
  entity_id: number;
  entity_name: string;
  entity_blockchain_id: string;
  event_type: number;
  event_group: number;
  json_value: any;
}

export class EntityJobExecutorService {
  public static async processEntityEventParam(): Promise<void> {
    // Fetch one posts current rate and write it like importance worker does

    const events: EntityEventParam[] = [
      {
        entity_id: 1,
        entity_name: OrganizationsModelProvider.getEntityName(),
        entity_blockchain_id: 'sample_blockchain_id_1',
        event_type: 2,
        event_group: 1,
        json_value: { key1: 'value1' },
      },
      {
        entity_id: 2,
        entity_name: PostsModelProvider.getEntityName(),
        entity_blockchain_id: 'sample_blockchain_id_2',
        event_type: 3,
        event_group: 1,
        json_value: { key2: 'value2' },
      },
    ];

    await knexEvents(ENTITY_EVENT_TABLE_NAME).insert(events);
  }
}
