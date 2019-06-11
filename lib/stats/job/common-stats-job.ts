import { IdToPropsCollection } from '../../common/interfaces/common-types';
import { EntityEventParamDto } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';
import { EntityAggregatesDto } from '../interfaces/dto-interfaces';
import { AppError } from '../../api/errors';

import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import CommonModelProvider = require('../../common/service/common-model-provider');
import JsonValueService = require('../service/json-value-service');

const { PostTypes } = require('ucom.libs.common').Posts.Dictionary;

class CommonStatsJob {
  public static async calculatePostsCurrentAmount(
    data:        EntityAggregatesDto[],
    eventType:   number,
    entityName:  string,
    entityLabel: string,
  ): Promise<IdToPropsCollection> {
    const events: EntityEventParamDto[] = [];

    const dataRes: IdToPropsCollection = {};

    for (const item of data) {
      const payload = {
        media_posts:  0,
        direct_posts: 0,
        total:        0,
      };

      for (const aggType in item.aggregates) {
        if (+aggType === PostTypes.MEDIA) {
          payload.media_posts = item.aggregates[aggType];
        } else if (+aggType === PostTypes.DIRECT) {
          payload.direct_posts = item.aggregates[aggType];
        } else {
          throw new AppError(`aggType ${aggType} is not supported`);
        }
      }

      payload.total = payload.media_posts + payload.direct_posts;

      dataRes[item.entityId] = {
        mediaPosts:   payload.media_posts,
        directPosts:  payload.direct_posts,
      };

      events.push({
        entity_id:    item.entityId,
        entity_name:  entityName,
        event_type:   eventType,
        json_value:   JsonValueService.getJsonValueParameter(`media posts and direct posts amount of ${entityLabel}`, payload),
        result_value: payload.total,

        event_group: EventParamGroupDictionary.getNotDetermined(),
        event_super_group: EventParamSuperGroupDictionary.getNotDetermined(),
        entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
      });
    }

    await EntityEventRepository.insertManyEvents(events);

    return dataRes;
  }
}

export = CommonStatsJob;
