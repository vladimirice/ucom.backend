import { DeltaParams } from '../interfaces/dto-interfaces';

import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import EventParamGroupDictionary = require('../dictionary/event-param/event-param-group-dictionary');
import EventParamSuperGroupDictionary = require('../dictionary/event-param/event-param-super-group-dictionary');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');

const ENTITY_NAME       = OrganizationsModelProvider.getEntityName();
const currentTableName  = OrganizationsModelProvider.getCurrentParamsTableName();
const whenFieldName       = 'organization_id';

const windowIntervalHours           = 24 * 3;
const windowIntervalOneWeekInHours  = 24 * 7;

const oneToOneSet: DeltaParams[] = [
  {
    windowIntervalHours: windowIntervalOneWeekInHours,

    entityName:       ENTITY_NAME,

    initialEventType: EventParamTypeDictionary.getCurrentBlockchainImportance(),
    resultEventType:  EventParamTypeDictionary.getBlockchainImportanceDelta(),
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),

    paramField:       'importance',
    paramFieldDelta:  'importance_delta',
    isFloat:          true,
    description:      `Importance delta for ${ENTITY_NAME}`,
    currentParams: {
      whenFieldName,
      tableName:      currentTableName,
      fieldNameToSet: 'importance_delta',
    },
  },
  {
    windowIntervalHours: windowIntervalOneWeekInHours,
    entityName:       ENTITY_NAME,

    initialEventType: EventParamTypeDictionary.getOrgPostsCurrentAmount(),
    resultEventType:  EventParamTypeDictionary.getOrgPostsTotalAmountDelta(),
    paramField:       'total',
    paramFieldDelta:  'total_delta',
    description:      `Posts total amount delta for ${ENTITY_NAME}`,

    isFloat:          false,
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),
    currentParams: {
      whenFieldName,
      tableName:      currentTableName,
      fieldNameToSet: 'posts_total_amount_delta',
    },
  },
  {
    windowIntervalHours,
    entityName:       ENTITY_NAME,

    initialEventType: EventParamTypeDictionary.getOrgCurrentActivityIndex(),
    resultEventType:  EventParamTypeDictionary.getOrgsActivityIndexDelta(),
    paramField:       'activity_index',
    paramFieldDelta:  'activity_index_delta',
    description:      `activity_index delta for ${ENTITY_NAME}`,

    isFloat:          true,
    eventGroup:       EventParamGroupDictionary.getNotDetermined(),
    eventSuperGroup:  EventParamSuperGroupDictionary.getNotDetermined(),
    currentParams: {
      whenFieldName,
      tableName:  currentTableName,
      fieldNameToSet: 'activity_index_delta',
    },
  },
];

class OrgsJobParams {
  public static getOneToOneSet(): DeltaParams[] {
    return oneToOneSet;
  }
}

export = OrgsJobParams;
