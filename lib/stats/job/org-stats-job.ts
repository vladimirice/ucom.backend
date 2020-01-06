/* eslint-disable guard-for-in */
import { EventsIdsDictionary } from 'ucom.libs.common';
import { EntityEventParamDto } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';
import {
  IdToNumberCollection,
  IdToPropsCollection,
} from '../../common/interfaces/common-types';
import { EntityAggregatesDto, OrgIdToStats } from '../interfaces/dto-interfaces';

import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import JsonValueService = require('../service/json-value-service');
import PostsRepository = require('../../posts/posts-repository');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');

import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import ActivityIndexFormulas = require('../formulas/activity-index-formulas');
import CommonStatsJob = require('./common-stats-job');
import CommonModelProvider = require('../../common/service/common-model-provider');

const params = {
  entityName:   OrganizationsModelProvider.getEntityName(),
  entityLabel:  OrganizationsModelProvider.getTableName(),
};

class OrgStatsJob {
  public static async processCurrentValues(): Promise<void> {
    const data: EntityAggregatesDto[] = await PostsRepository.getManyOrgsPostsAmount();
    const eventType = EventParamTypeDictionary.getOrgPostsCurrentAmount();

    const [orgIdToPosts, orgIdToFollowers]: [IdToPropsCollection, IdToNumberCollection] =
    await Promise.all([
      CommonStatsJob.calculatePostsCurrentAmount(data, eventType, params.entityName, params.entityLabel),
      this.calculateFollowersCurrentAmount(),
    ]);

    const orgIdToStats: OrgIdToStats = this.collectAllMetricsInOne(orgIdToPosts, orgIdToFollowers);

    await this.calculateActivityIndex(orgIdToStats);
  }

  private static async calculateActivityIndex(orgIdToStats: OrgIdToStats): Promise<void> {
    const eventType       = EventParamTypeDictionary.getOrgCurrentActivityIndex();
    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();

    const events: EntityEventParamDto[] = [];

    for (const orgId in orgIdToStats) {
      const stats = orgIdToStats[orgId];

      const { resultValue, description } = ActivityIndexFormulas.getOrgActivityIndex(stats);
      const payload = {
        activity_index: resultValue,
        number_of_direct_posts: stats.directPosts,
        number_of_media_posts:  stats.mediaPosts,
        number_of_followers:    stats.followers,
      };

      events.push({
        entity_id: +orgId,
        entity_name: params.entityName,
        entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter(description, payload),
        result_value: resultValue,
      });
    }

    await EntityEventRepository.insertManyEvents(events);
  }

  private static async calculateFollowersCurrentAmount(): Promise<IdToNumberCollection> {
    const data = await UsersActivityRepository.getManyOrgsFollowers();
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    const eventType = EventParamTypeDictionary.getOrgFollowersCurrentAmount();

    const dataRes: IdToNumberCollection = {};

    data.forEach((item) => {
      const up = item.aggregates[EventsIdsDictionary.getUserFollowsOrg()] || 0;
      const down = item.aggregates[EventsIdsDictionary.getUserUnfollowsOrg()] || 0;

      const followers = up - down;
      const payload = {
        followers,
      };

      dataRes[item.entityId] = followers;

      events.push({
        entity_id: +item.entityId,
        entity_name: params.entityName,
        entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter(`followers of ${params.entityLabel}`, payload),
        result_value: followers,
      });
    });

    await EntityEventRepository.insertManyEvents(events);

    return dataRes;
  }

  private static collectAllMetricsInOne(
    orgIdToPosts: IdToPropsCollection,
    orgIdToFollowers: IdToNumberCollection,
  ): OrgIdToStats {
    const orgIdToStats: OrgIdToStats = {};

    for (const orgId in orgIdToPosts) {
      this.initOrgIdToStatsIfRequired(orgIdToStats, +orgId);
      orgIdToStats[+orgId].mediaPosts = +orgIdToPosts[orgId].mediaPosts;
      orgIdToStats[+orgId].directPosts = +orgIdToPosts[orgId].directPosts;
    }

    for (const orgId in orgIdToFollowers) {
      this.initOrgIdToStatsIfRequired(orgIdToStats, +orgId);
      orgIdToStats[+orgId].followers = orgIdToFollowers[orgId];
    }

    return orgIdToStats;
  }

  private static initOrgIdToStatsIfRequired(idToStats: OrgIdToStats, entityId: number): void {
    if (idToStats[entityId]) {
      return;
    }

    idToStats[entityId] = {
      mediaPosts:   0,
      directPosts:  0,
      followers:    0,
    };
  }
}

export = OrgStatsJob;
