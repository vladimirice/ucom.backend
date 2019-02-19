import { DeltaParams } from '../interfaces/dto-interfaces';

import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import TagsModelProvider = require('../../tags/service/tags-model-provider');

const ENTITY_NAME       = TagsModelProvider.getEntityName();
const currentTableName  = TagsModelProvider.getCurrentParamsTableName();

const oneToOneSet: DeltaParams[] = [
  {
    entityName:       ENTITY_NAME,

    initialEventType: EventParamTypeDictionary.getTagCurrentActivityIndex(),
    resultEventType:  EventParamTypeDictionary.getTagsActivityIndexDelta(),
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),

    paramField:       'activity_index',
    paramFieldDelta:  'activity_index_delta',
    isFloat:          true,
    description:      `Activity index delta for ${ENTITY_NAME}`,
    currentParams: {
      tableName:  currentTableName,
      fieldNameToSet: 'activity_index_delta',
    },
  },
  {
    entityName:       ENTITY_NAME,

    initialEventType: EventParamTypeDictionary.getTagItselfCurrentAmounts(),
    resultEventType:  EventParamTypeDictionary.getTagsImportanceDelta(),
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),

    paramField:       'importance',
    paramFieldDelta:  'importance_delta',
    isFloat:          true,
    description:      `Importance delta for ${ENTITY_NAME}`,
    currentParams: {
      tableName:      currentTableName,
      fieldNameToSet: 'importance_delta',
    },
  },
  {
    entityName:       ENTITY_NAME,

    initialEventType: EventParamTypeDictionary.getTagItselfCurrentAmounts(),
    resultEventType:  EventParamTypeDictionary.getTagPostsTotalAmountDelta(),
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),

    paramField:       'current_posts_amount',
    paramFieldDelta:  'current_posts_amount_delta',
    isFloat:          false,
    description:      `current_posts_amount delta for ${ENTITY_NAME}`,
    currentParams: {
      tableName:      currentTableName,
      fieldNameToSet: 'posts_total_amount_delta',
    },
  },
];

class TagsJobParams {
  public static getOneToOneSet(): DeltaParams[] {
    return oneToOneSet;
  }
}

export = TagsJobParams;
