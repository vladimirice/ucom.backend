import { DeltaParams } from '../interfaces/dto-interfaces';

import PostsModelProvider = require('../../posts/service/posts-model-provider');
import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');

const ENTITY_NAME         = PostsModelProvider.getEntityName();
const currentTableName    = PostsModelProvider.getCurrentParamsTableName();
const whenFieldName       = 'post_id';

const windowIntervalHours = 24 * 3;

const oneToOneSet: DeltaParams[] = [
  {
    entityName:       ENTITY_NAME,
    initialEventType: EventParamTypeDictionary.getCurrentBlockchainImportance(),
    resultEventType:  EventParamTypeDictionary.getBlockchainImportanceDelta(),
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),

    paramField:       'importance',
    paramFieldDelta:  'importance_delta',
    isFloat:          true,
    description:      `Importance delta for ${ENTITY_NAME}`,
    windowIntervalHours,

    currentParams: {
      whenFieldName,
      tableName:      currentTableName,
      fieldNameToSet: 'importance_delta',
    },
  },
  {
    entityName:       ENTITY_NAME,

    initialEventType: EventParamTypeDictionary.getPostVotesCurrentAmount(),
    resultEventType:  EventParamTypeDictionary.getPostUpvotesDelta(),
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),

    paramField:       'upvotes',
    paramFieldDelta:  'upvotes_delta',
    isFloat:          false,
    description:      `Upvotes delta for ${ENTITY_NAME}`,
    windowIntervalHours,

    currentParams: {
      whenFieldName,
      tableName:  currentTableName,
      fieldNameToSet: 'upvotes_delta',
    },
  },
  {
    entityName:       ENTITY_NAME,

    initialEventType: EventParamTypeDictionary.getPostCurrentActivityIndex(),
    resultEventType:  EventParamTypeDictionary.getPostActivityIndexDelta(),
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),

    paramField:       'activity_index',
    paramFieldDelta:  'activity_index_delta',
    isFloat:          false,
    description:      `Activity index delta for ${ENTITY_NAME}`,
    windowIntervalHours,

    currentParams: {
      whenFieldName,
      tableName:  currentTableName,
      fieldNameToSet: 'activity_index_delta',
    },
  },
];

class PostsJobParams {
  public static getOneToOneSet(): DeltaParams[] {
    return oneToOneSet;
  }
}

export = PostsJobParams;
