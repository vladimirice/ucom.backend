import { EntityEventParamDto } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';
import { NumberToNumberCollection } from '../../common/interfaces/common-types';

import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import JsonValueService = require('../service/json-value-service');
import PostsRepository = require('../../posts/posts-repository');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');

import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import NotificationsEventIdDictionary = require('../../entities/dictionary/notifications-event-id-dictionary');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const ENTITY_NAME = OrganizationsModelProvider.getEntityName();

// #task determine entity blockchain ID for all cases
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';

interface EntityAggregatesDto {
  readonly entityId:      number;
  readonly aggregates:  NumberToNumberCollection;
}

class OrgStatsJob {
  public static async processCurrentValues(): Promise<void> {
    await Promise.all([
      this.calculatePostsCurrentAmount(),
      this.calculateFollowersCurrentAmount(),
    ]);
  }

  private static async calculateFollowersCurrentAmount(): Promise<void> {
    const data = await UsersActivityRepository.getManyOrgsFollowers();
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    const eventType = EventParamTypeDictionary.getOrgFollowersCurrentAmount();

    data.forEach((item) => {
      const up = item.aggregates[NotificationsEventIdDictionary.getUserFollowsOrg()] || 0;
      const down = item.aggregates[NotificationsEventIdDictionary.getUserUnfollowsOrg()] || 0;

      const followers = up - down;
      const payload = {
        followers,
      };

      events.push({
        entity_id: +item.entityId,
        entity_name: ENTITY_NAME,
        entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter('followers of organization', payload),
        result_value: followers,
      });
    });

    await EntityEventRepository.insertManyEvents(events);
  }

  // @ts-ignore
  private static async calculatePostsCurrentAmount(): Promise<void> {
    const data: EntityAggregatesDto[] = await PostsRepository.getManyOrgsPostsAmount();
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    const eventType = EventParamTypeDictionary.getOrgPostsCurrentAmount();

    data.forEach((item) => {
      const payload = {
        media_posts: 0,
        direct_posts: 0,
        total: 0,
      };

      for (const aggType in item.aggregates) {
        if (+aggType === ContentTypeDictionary.getTypeMediaPost()) {
          payload.media_posts = item.aggregates[aggType];
        } else if (+aggType === ContentTypeDictionary.getTypeDirectPost()) {
          payload.direct_posts = item.aggregates[aggType];
        }
      }

      payload.total = payload.media_posts + payload.direct_posts;

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
    });

    await EntityEventRepository.insertManyEvents(events);
  }
}

export = OrgStatsJob;
