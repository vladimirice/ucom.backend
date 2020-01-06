"use strict";
/* eslint-disable guard-for-in */
const ucom_libs_common_1 = require("ucom.libs.common");
const entity_event_repository_1 = require("../repository/entity-event-repository");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const JsonValueService = require("../service/json-value-service");
const PostsRepository = require("../../posts/posts-repository");
const CommentsRepository = require("../../comments/comments-repository");
const ActivityIndexFormulas = require("../formulas/activity-index-formulas");
const ENTITY_NAME = PostsModelProvider.getEntityName();
// #task determine entity blockchain ID for all cases
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';
class PostsStatsJob {
    static async processPostsCurrentValues() {
        const [postIdToComment, postIdToReposts, postIdToVotes] = await Promise.all([
            this.calculateCommentsAmount(),
            this.calculateRepostsAmount(),
            this.calculatePostsVotes(),
        ]);
        const postIdToStats = this.collectAllMetricsInOne(postIdToComment, postIdToReposts, postIdToVotes);
        await this.calculateActivityIndex(postIdToStats);
    }
    static collectAllMetricsInOne(postIdToComment, postIdToReposts, postIdToVotes) {
        const postIdToStats = {};
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
    static initPostIdToStatsIfRequired(postIdToStats, postId) {
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
    static async calculateActivityIndex(postIdToStats) {
        const eventType = EventParamTypeDictionary.getPostCurrentActivityIndex();
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();
        const events = [];
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
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
    }
    // @ts-ignore
    static async calculateCommentsAmount() {
        const eventType = EventParamTypeDictionary.getPostCommentsCurrentAmount();
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();
        const data = await CommentsRepository.getManyPostsCommentsAmount();
        const events = [];
        const dataRes = {};
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
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
        return dataRes;
    }
    static async calculateRepostsAmount() {
        const eventType = EventParamTypeDictionary.getPostRepostsCurrentAmount();
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();
        const data = await PostsRepository.getManyPostsRepostsAmount();
        const events = [];
        const dataRes = {};
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
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
        return dataRes;
    }
    static async calculatePostsVotes() {
        const data = await UsersActivityRepository.getPostsVotes();
        const events = [];
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        const eventType = EventParamTypeDictionary.getPostVotesCurrentAmount();
        const dataRes = {};
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
                upvotes: payload.upvotes,
                downvotes: payload.downvotes,
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
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
        return dataRes;
    }
    static processAggValue(aggregate, payload) {
        if (!aggregate) {
            return;
        }
        const [activityType, value] = aggregate.split('__');
        if (+activityType === ucom_libs_common_1.InteractionTypesDictionary.getUpvoteId()) {
            payload.upvotes = +value;
        }
        else {
            payload.downvotes = +value;
        }
    }
}
module.exports = PostsStatsJob;
