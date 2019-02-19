"use strict";
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const ENTITY_NAME = OrganizationsModelProvider.getEntityName();
const currentTableName = OrganizationsModelProvider.getCurrentParamsTableName();
const oneToOneSet = [
    {
        entityName: ENTITY_NAME,
        initialEventType: EventParamTypeDictionary.getCurrentBlockchainImportance(),
        resultEventType: EventParamTypeDictionary.getBlockchainImportanceDelta(),
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        paramField: 'importance',
        paramFieldDelta: 'importance_delta',
        isFloat: true,
        description: `Importance delta for ${ENTITY_NAME}`,
        currentParams: {
            tableName: currentTableName,
            fieldNameToSet: 'importance_delta',
        },
    },
    {
        entityName: ENTITY_NAME,
        initialEventType: EventParamTypeDictionary.getOrgPostsCurrentAmount(),
        resultEventType: EventParamTypeDictionary.getOrgPostsTotalAmountDelta(),
        paramField: 'total',
        paramFieldDelta: 'total_delta',
        description: `Posts total amount delta for ${ENTITY_NAME}`,
        isFloat: false,
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        currentParams: {
            tableName: currentTableName,
            fieldNameToSet: 'posts_total_amount_delta',
        },
    },
    {
        entityName: ENTITY_NAME,
        initialEventType: EventParamTypeDictionary.getOrgCurrentActivityIndex(),
        resultEventType: EventParamTypeDictionary.getOrgsActivityIndexDelta(),
        paramField: 'activity_index',
        paramFieldDelta: 'activity_index_delta',
        description: `activity_index delta for ${ENTITY_NAME}`,
        isFloat: true,
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        currentParams: {
            tableName: currentTableName,
            fieldNameToSet: 'activity_index_delta',
        },
    },
];
class OrgsJobParams {
    static getOneToOneSet() {
        return oneToOneSet;
    }
}
module.exports = OrgsJobParams;
