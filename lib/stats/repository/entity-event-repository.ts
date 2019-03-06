import { EntityEventParamDto } from '../interfaces/model-interfaces';

import knexEvents = require('../../../config/knex-events');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import TagsModelProvider = require('../../tags/service/tags-model-provider');
import CommonModelProvider = require('../../common/service/common-model-provider');
import RepositoryHelper = require('../../common/repository/repository-helper');

const TABLE_NAME = 'entity_event_param';

export class EntityEventRepository {
  public static async findManyEventsWithTagEntityName(
    eventType: number | null = null,
  ): Promise<EntityEventParamDto[]> {
    return this.findManyEventsByEntityName(TagsModelProvider.getEntityName(), eventType);
  }

  public static async findManyEventsWithOrgEntityName(
    eventType: number | null = null,
  ): Promise<EntityEventParamDto[]> {
    return this.findManyEventsByEntityName(OrganizationsModelProvider.getEntityName(), eventType);
  }

  public static async findOneEventOfTotals(eventType: number) {
    const where: any = {
      entity_name: CommonModelProvider.getEntityName(),
      event_type: eventType,
    };

    const data = await knexEvents(TABLE_NAME)
      .where(where)
      .first();

    if (!data) {
      return null;
    }

    RepositoryHelper.convertStringFieldsToNumbers(data, this.getNumericalFields());

    return data;
  }

  public static async findManyEventsWithPostEntityName(
    eventType: number | null = null,
  ): Promise<EntityEventParamDto[]> {
    return this.findManyEventsByEntityName(PostsModelProvider.getEntityName(), eventType);
  }

  public static async insertOneEvent(event: EntityEventParamDto): Promise<void> {
    await knexEvents(TABLE_NAME).insert(event);
  }

  public static async insertManyEvents(events: EntityEventParamDto[]): Promise<void> {
    await knexEvents.batchInsert(TABLE_NAME, events);
  }

  private static async findManyEventsByEntityName(
    entityName: string,
    eventType: number | null = null,
  ): Promise<EntityEventParamDto[]> {
    const where: any = {
      entity_name: entityName,
    };

    if (eventType !== null) {
      where.event_type = +eventType;
    }

    return knexEvents(TABLE_NAME)
      .where(where);
  }

  /**
   *
   * @param {string} where
   * @return {Promise<Object[]>}
   */
  static async findLastRowsGroupedByEntity(where) {
    return knexEvents(TABLE_NAME).distinct(knexEvents.raw(
      'ON (entity_id, event_type) entity_id, json_value, entity_name, entity_blockchain_id, result_value',
    ))
      .whereRaw(where)
      .orderBy('entity_id')
      .orderBy('event_type')
      .orderBy('id', 'DESC')
    ;
  }

  private static getNumericalFields(): string[] {
    return [
      'id',
      'entity_id',
      'result_value',
    ];
  }
}
