"use strict";
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const ENTITY_NAME = PostsModelProvider.getEntityName();
const paramsSet = [
    {
        entityName: PostsModelProvider.getEntityName(),
        initialEventType: EventParamTypeDictionary.getCurrentBlockchainImportance(),
        resultEventType: EventParamTypeDictionary.getBlockchainImportanceDelta(),
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        paramField: 'importance',
        paramFieldDelta: 'importance_delta',
        isFloat: true,
        description: `Importance delta for ${ENTITY_NAME}`,
    },
    {
        entityName: PostsModelProvider.getEntityName(),
        initialEventType: EventParamTypeDictionary.getPostVotesCurrentAmount(),
        resultEventType: EventParamTypeDictionary.getPostUpvotesDelta(),
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        paramField: 'upvotes',
        paramFieldDelta: 'upvotes_delta',
        isFloat: false,
        description: `Upvotes delta for ${ENTITY_NAME}`,
    },
    {
        entityName: PostsModelProvider.getEntityName(),
        initialEventType: EventParamTypeDictionary.getPostCurrentActivityIndex(),
        resultEventType: EventParamTypeDictionary.getPostActivityIndexDelta(),
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        paramField: 'activity_index',
        paramFieldDelta: 'activity_index_delta',
        isFloat: false,
        description: `Activity index delta for ${ENTITY_NAME}`,
    },
];
class PostsJobParams {
    static getParamsSet() {
        return paramsSet;
    }
}
module.exports = PostsJobParams;
