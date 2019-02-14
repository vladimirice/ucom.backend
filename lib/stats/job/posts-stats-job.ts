/* eslint-disable guard-for-in */
import { EntityEventParamDto } from '../interfaces/model-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';
import {
  IdToNumberCollection,
  IdToPropsCollection,
} from '../../common/interfaces/common-types';
import { PostIdToStats } from '../interfaces/dto-interfaces';

import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import JsonValueService = require('../service/json-value-service');
import PostsRepository = require('../../posts/posts-repository');
import CommentsRepository = require('../../comments/comments-repository');
import ActivityIndexFormulas = require('../formulas/activity-index-formulas');

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
    const [postIdToComment, postIdToReposts, postIdToVotes]:
      [IdToNumberCollection, IdToNumberCollection, IdToPropsCollection]
      = await Promise.all([
        this.calculateCommentsAmount(),
        this.calculateRepostsAmount(),
        this.calculatePostsVotes(),
      ]);

    const postIdToStats = this.collectAllMetricsInOne(
      postIdToComment,
      postIdToReposts,
      postIdToVotes,
    );

    await this.calculateActivityIndex(postIdToStats);
  }

  private static collectAllMetricsInOne(
    postIdToComment: IdToNumberCollection,
    postIdToReposts: IdToNumberCollection,
    postIdToVotes: IdToPropsCollection,
  ): PostIdToStats {
    const postIdToStats: PostIdToStats = {};

    for (const postId in postIdToComment) {
      this.initPostIdToStatsIfRequired(postIdToStats, +postId);
      postIdToStats[+postId].comments = postIdToComment[postId];
    }

    for (const postId in postIdToReposts) {
      this.initPostIdToStatsIfRequired(postIdToStats, +postId);
      postIdToStats[+postId].reposts = postIdToReposts[postId];
    }

    for (const postId in postIdToVotes) {
      this.initPostIdToStatsIfRequired(postIdToStats, +postId);
      postIdToStats[+postId].upvotes = +postIdToVotes[postId].upvotes;
      postIdToStats[+postId].downvotes = +postIdToVotes[postId].downvotes;
    }

    return postIdToStats;
  }

  private static initPostIdToStatsIfRequired(postIdToStats: PostIdToStats, postId: number): void {
    if (postIdToStats[postId]) {
      return;
    }

    postIdToStats[postId] = {
      comments: 0,
      reposts: 0,
      upvotes: 0,
      downvotes: 0,
    };
  }

  private static async calculateActivityIndex(postIdToStats: PostIdToStats): Promise<void> {
    const eventType       = EventParamTypeDictionary.getPostCurrentActivityIndex();
    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();

    const events: EntityEventParamDto[] = [];

    for (const postId in postIdToStats) {
      const stats = postIdToStats[postId];

      const { resultValue, description } = ActivityIndexFormulas.getPostActivityIndex(stats);
      const payload = {
        activity_index: resultValue,
        number_of_comments_with_replies: stats.comments,
        number_of_reposts: stats.reposts,
        number_of_upvotes: stats.upvotes,
        number_of_downvotes: stats.downvotes,
      };

      events.push({
        entity_id: +postId,
        entity_name: ENTITY_NAME,
        entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
        event_type: eventType,
        event_group: eventGroup,
        event_super_group: eventSuperGroup,
        json_value: JsonValueService.getJsonValueParameter(description, payload),
        result_value: resultValue,
      });
    }

    await EntityEventRepository.insertManyEvents(events);
  }

  // @ts-ignore
  private static async calculateCommentsAmount(): Promise<IdToNumberCollection> {
    const eventType       = EventParamTypeDictionary.getPostCommentsCurrentAmount();
    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();

    const data: PostCommentsStatsDto[] = await CommentsRepository.getManyPostsCommentsAmount();
    const events: EntityEventParamDto[] = [];

    const dataRes: IdToNumberCollection = {};

    for (const item of data) {
      const resultValue = item.commentsAmount;
      const payload = {
        comments: resultValue,
      };

      dataRes[item.entityId] = item.commentsAmount;

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
    }

    await EntityEventRepository.insertManyEvents(events);

    return dataRes;
  }

  private static async calculateRepostsAmount(): Promise<IdToNumberCollection> {
    const eventType       = EventParamTypeDictionary.getPostRepostsCurrentAmount();
    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();

    const data: PostStatsDto[] = await PostsRepository.getManyPostsRepostsAmount();
    const events: EntityEventParamDto[] = [];

    const dataRes: IdToNumberCollection = {};

    data.forEach((item) => {
      const resultValue = item.repostsAmount;
      const payload = {
        reposts: resultValue,
      };

      dataRes[item.entityId] = resultValue;

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

    return dataRes;
  }

  private static async calculatePostsVotes(): Promise<IdToPropsCollection> {
    const data = await UsersActivityRepository.getPostsVotes();
    const events: EntityEventParamDto[] = [];

    const eventGroup      = EventParamGroupDictionary.getNotDetermined();
    const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();

    const eventType = EventParamTypeDictionary.getPostVotesCurrentAmount();

    const dataRes: IdToPropsCollection = {};

    data.forEach((item) => {
      const payload = {
        upvotes: 0,
        downvotes: 0,
        total: 0,
      };
      // #task refactor this as for org-stats-job
      const [aggOne, aggTwo] = item.array_agg;

      this.processAggValue(aggOne, payload);
      this.processAggValue(aggTwo, payload);

      payload.total = payload.upvotes - payload.downvotes;

      dataRes[item.entity_id_to] = {
        upvotes:    payload.upvotes,
        downvotes:  payload.downvotes,
      };

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

    return dataRes;
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
