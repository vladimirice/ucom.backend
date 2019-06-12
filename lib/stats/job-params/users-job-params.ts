import { DeltaParams } from '../interfaces/dto-interfaces';

import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import UsersModelProvider = require('../../users/users-model-provider');

const windowIntervalOneDay = 24;

const commonSetParams = {
  entityName:       UsersModelProvider.getEntityName(),
  currentTableName: UsersModelProvider.getCurrentParamsTableName(),
  foreignFieldName: UsersModelProvider.getForeignKeyField(),
  entityLabel:      UsersModelProvider.getTableName(),
};

const oneToOneSet: DeltaParams[] = [
  {
    windowIntervalHours: windowIntervalOneDay,
    entityName:          commonSetParams.entityName,

    initialEventType: EventParamTypeDictionary.getUsersPostsCurrentAmount(),
    resultEventType:  EventParamTypeDictionary.getUsersPostsTotalAmountDelta(),
    paramField:       'total',
    paramFieldDelta:  'total_delta',
    description:      `Posts total amount delta for ${commonSetParams.entityLabel}`,

    isFloat:          false,
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),
    currentParams: {
      whenFieldName:  commonSetParams.foreignFieldName,
      tableName:      commonSetParams.currentTableName,
      fieldNameToSet: 'posts_total_amount_delta',
    },
  },
  {
    windowIntervalHours: windowIntervalOneDay,
    entityName:          commonSetParams.entityName,

    initialEventType: EventParamTypeDictionary.getUserHimselfCurrentAmounts(),
    resultEventType:  EventParamTypeDictionary.getUsersScaledImportanceDelta(),
    paramField:       'scaled_importance',
    paramFieldDelta:  'scaled_importance_delta',
    description:      `Posts total amount delta for ${commonSetParams.entityLabel}`,

    isFloat:          false,
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),
    currentParams: {
      whenFieldName:  commonSetParams.foreignFieldName,
      tableName:      commonSetParams.currentTableName,
      fieldNameToSet: 'scaled_importance_delta',
    },
  },
];

class UsersJobParams {
  public static getOneToOneSet(): DeltaParams[] {
    return oneToOneSet;
  }
}

export = UsersJobParams;
