/* eslint-disable guard-for-in */
import { EntityEventParamDto } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';
import {
  IdToPropsCollection,
  NumberToNumberCollection,
} from '../../common/interfaces/common-types';

import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import JsonValueService = require('../service/json-value-service');
import PostsRepository = require('../../posts/posts-repository');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import CommonStatsJob = require('./common-stats-job');
import UsersModelProvider = require('../../users/users-model-provider');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const ENTITY_NAME = OrganizationsModelProvider.getEntityName();

// #task determine entity blockchain ID for all cases
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';

interface EntityAggregatesDto {
  readonly entityId:      number;
  readonly aggregates:  NumberToNumberCollection;
}

class UsersStatsJob {
  public static async processCurrentValues(): Promise<void> {
    /*
      Process posts amount as for org
      TODO Process uos_accounts_properties as tags
     */

    const data: EntityAggregatesDto[] = await PostsRepository.getManyUsersPostsAmount();
    const eventType:  number = EventParamTypeDictionary.getUsersPostsCurrentAmount();
    const entityName: string = UsersModelProvider.getEntityName();
    const entityLabel: string = UsersModelProvider.getTableName();

    CommonStatsJob.calculatePostsCurrentAmount(data, eventType, entityName, entityLabel);

    await this.calculatePostsCurrentAmount();
  }

  private static async calculatePostsCurrentAmount(): Promise<IdToPropsCollection> {
    const data: EntityAggregatesDto[] = await PostsRepository.getManyUsersPostsAmount();
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    const eventType = EventParamTypeDictionary.getUsersPostsCurrentAmount();

    const dataRes: IdToPropsCollection = {};

    for (const item of data) {
      const payload = {
        media_posts:  0,
        direct_posts: 0,
        total:        0,
      };

      for (const aggType in item.aggregates) {
        if (+aggType === ContentTypeDictionary.getTypeMediaPost()) {
          payload.media_posts = item.aggregates[aggType];
        } else if (+aggType === ContentTypeDictionary.getTypeDirectPost()) {
          payload.direct_posts = item.aggregates[aggType];
        }
      }

      payload.total = payload.media_posts + payload.direct_posts;

      dataRes[item.entityId] = {
        mediaPosts:   payload.media_posts,
        directPosts:  payload.direct_posts,
      };

      events.push({
        entity_id: +item.entityId,
        entity_name: ENTITY_NAME,
        entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter('media posts and direct posts amount of organization', payload),
        result_value: payload.total,
      });
    }

    await EntityEventRepository.insertManyEvents(events);

    return dataRes;
  }
}

export = UsersStatsJob;
