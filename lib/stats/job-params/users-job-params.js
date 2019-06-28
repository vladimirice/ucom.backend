"use strict";
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const UsersModelProvider = require("../../users/users-model-provider");
const windowIntervalOneDay = 24;
const commonSetParams = {
    entityName: UsersModelProvider.getEntityName(),
    currentTableName: UsersModelProvider.getCurrentParamsTableName(),
    foreignFieldName: UsersModelProvider.getForeignKeyField(),
    entityLabel: UsersModelProvider.getTableName(),
};
const oneToOneSet = [
    {
        windowIntervalHours: windowIntervalOneDay,
        entityName: commonSetParams.entityName,
        initialEventType: EventParamTypeDictionary.getUsersPostsCurrentAmount(),
        resultEventType: EventParamTypeDictionary.getUsersPostsTotalAmountDelta(),
        paramField: 'total',
        paramFieldDelta: 'total_delta',
        description: `A delta for ${commonSetParams.entityLabel}`,
        isFloat: false,
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        currentParams: {
            whenFieldName: commonSetParams.foreignFieldName,
            tableName: commonSetParams.currentTableName,
            fieldNameToSet: 'posts_total_amount_delta',
        },
    },
    {
        windowIntervalHours: windowIntervalOneDay,
        entityName: commonSetParams.entityName,
        initialEventType: EventParamTypeDictionary.getUserHimselfCurrentAmounts(),
        resultEventType: EventParamTypeDictionary.getUsersScaledImportanceDelta(),
        paramField: 'scaled_importance',
        paramFieldDelta: 'scaled_importance_delta',
        description: `A delta for ${commonSetParams.entityLabel}`,
        isFloat: true,
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        currentParams: {
            whenFieldName: commonSetParams.foreignFieldName,
            tableName: commonSetParams.currentTableName,
            fieldNameToSet: 'scaled_importance_delta',
        },
    },
    {
        windowIntervalHours: windowIntervalOneDay,
        entityName: commonSetParams.entityName,
        initialEventType: EventParamTypeDictionary.getUserHimselfCurrentAmounts(),
        resultEventType: EventParamTypeDictionary.getUsersScaledSocialRateDelta(),
        paramField: 'scaled_social_rate',
        paramFieldDelta: 'scaled_social_rate_delta',
        description: `A delta for ${commonSetParams.entityLabel}`,
        isFloat: true,
        eventGroup: EventParamGroupDictionary.getNotDetermined(),
        eventSuperGroup: EventParamSuperGroupDictionary.getNotDetermined(),
        currentParams: {
            whenFieldName: commonSetParams.foreignFieldName,
            tableName: commonSetParams.currentTableName,
            fieldNameToSet: 'scaled_social_rate_delta',
        },
    },
];
class UsersJobParams {
    static getOneToOneSet() {
        return oneToOneSet;
    }
}
module.exports = UsersJobParams;
