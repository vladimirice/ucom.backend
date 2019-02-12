import { EntityEventParamDto } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';

import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import JsonValueService = require('../service/json-value-service');
import PostsRepository = require('../../posts/posts-repository');
import CommentsRepository = require('../../comments/comments-repository');

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

const ENTITY_NAME = PostsModelProvider.getEntityName();

// #task determine entity blockchain ID for all cases
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';

interface PostStatsDto {
  readonly entityId:      number;
  readonly blockchainId:  string;
  readonly repostsAmount: number;
}

interface PostCommentsStatsDto {
  readonly entityId:        number;
  readonly commentsAmount:  number;
}

class PostsStatsJob {
  public static async processPostsCurrentValues(): Promise<void> {
    await Promise.all([
      this.calculatePostsVotes(),
      this.calculateRepostsAmount(),
      this.calculateCommentsAmount(),
    ]);
  }

  // @ts-ignore
  private static async calculateCommentsAmount(): Promise<void> {
    const eventType       = EventParamTypeDictionary.getPostCommentsCurrentAmount();
    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();

    const data: PostCommentsStatsDto[] = await CommentsRepository.getManyPostsCommentsAmount();
    const events: EntityEventParamDto[] = [];

    data.forEach((item) => {
      const resultValue = item.commentsAmount;
      const payload = {
        comments: resultValue,
      };

      events.push({
        entity_id: +item.entityId,
        entity_name: ENTITY_NAME,
        entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter('comments', payload),
        result_value: resultValue,
      });
    });

    await EntityEventRepository.insertManyEvents(events);
  }

  private static async calculateRepostsAmount(): Promise<void> {
    const eventType       = EventParamTypeDictionary.getPostRepostsCurrentAmount();
    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();

    const data: PostStatsDto[] = await PostsRepository.getManyPostsRepostsAmount();
    const events: EntityEventParamDto[] = [];

    data.forEach((item) => {
      const resultValue = item.repostsAmount;
      const payload = {
        reposts: resultValue,
      };

      events.push({
        entity_id: +item.entityId,
        entity_name: ENTITY_NAME,
        entity_blockchain_id: item.blockchainId,
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter('reposts', payload),
        result_value: resultValue,
      });
    });

    await EntityEventRepository.insertManyEvents(events);
  }

  private static async calculatePostsVotes(): Promise<void> {
    const data = await UsersActivityRepository.getPostsVotes();
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    const eventType = EventParamTypeDictionary.getPostVotesCurrentAmount();

    data.forEach((item) => {
      const payload = {
        upvotes: 0,
        downvotes: 0,
        total: 0,
      };
      const [aggOne, aggTwo] = item.array_agg;

      this.processAggValue(aggOne, payload);
      this.processAggValue(aggTwo, payload);

      payload.total = payload.upvotes - payload.downvotes;

      events.push({
        entity_id: +item.entity_id_to,
        entity_name: ENTITY_NAME,
        entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter('upvote_downvote', payload),
        result_value: payload.total,
      });
    });

    await EntityEventRepository.insertManyEvents(events);
  }

  private static processAggValue(aggregate, payload): void {
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
}

export = PostsStatsJob;
