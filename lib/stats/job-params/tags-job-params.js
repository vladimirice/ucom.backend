"use strict";
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const TagsModelProvider = require("../../tags/service/tags-model-provider");
const ENTITY_NAME = TagsModelProvider.getEntityName();
const paramsSet = [
    {
        entityName: ENTITY_NAME,
        initialEventType: EventParamTypeDictionary.getTagCurrentActivityIndex(),
        resultEventType: EventParamTypeDictionary.getTagsActivityIndexDelta(),
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        paramField: 'activity_index',
        paramFieldDelta: 'activity_index_delta',
        isFloat: true,
        description: `Activity index delta for ${ENTITY_NAME}`,
    },
    {
        entityName: ENTITY_NAME,
        initialEventType: EventParamTypeDictionary.getTagItselfCurrentAmounts(),
        resultEventType: EventParamTypeDictionary.getTagsImportanceDelta(),
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        paramField: 'importance',
        paramFieldDelta: 'importance_delta',
        isFloat: true,
        description: `Importance delta for ${ENTITY_NAME}`,
    },
    {
        entityName: ENTITY_NAME,
        initialEventType: EventParamTypeDictionary.getTagItselfCurrentAmounts(),
        resultEventType: EventParamTypeDictionary.getTagPostsTotalAmountDelta(),
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        paramField: 'current_posts_amount',
        paramFieldDelta: 'current_posts_amount_delta',
        isFloat: false,
        description: `current_posts_amount delta for ${ENTITY_NAME}`,
    },
];
class TagsJobParams {
    static getParamsSet() {
        return paramsSet;
    }
}
module.exports = TagsJobParams;
